import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version ?? '')) {
  throw new TypeError('Usage: npm run verify:registry -- <exact-version>');
}

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('npm_execpath is required to verify registry packages.');

const temporaryRoot = mkdtempSync(join(tmpdir(), 'phaser-game-registry-'));
const consumerDirectory = join(temporaryRoot, 'consumer');
const projectsDirectory = join(temporaryRoot, 'starters');
const npmCache = join(temporaryRoot, 'npm-cache');

try {
  mkdirSync(consumerDirectory);
  mkdirSync(projectsDirectory);
  writeFileSync(join(consumerDirectory, 'package.json'), JSON.stringify({
    name: 'phaser-game-engines-registry-consumer',
    private: true,
    type: 'module',
  }, null, 2));

  runNpm([
    'install', '--save-exact', '--ignore-scripts', '--no-audit', '--no-fund',
    `@phaser-game-engines/toolkit@${version}`,
    `@phaser-game-engines/create-game@${version}`,
    'phaser@4.2.1', 'vite@8.1.5', 'vitest@4.1.10', 'typescript@7.0.2',
  ], consumerDirectory);

  assertInstalledVersion('@phaser-game-engines/toolkit');
  assertInstalledVersion('@phaser-game-engines/create-game');
  assertInstalledBin('pge-content');
  assertInstalledBin('create-phaser-game-engines');

  writeFileSync(join(consumerDirectory, 'smoke.mjs'), `
const [core, platformer, topDown, battle, content, generator] = await Promise.all([
  import('@phaser-game-engines/toolkit/core/headless'),
  import('@phaser-game-engines/toolkit/platformer/headless'),
  import('@phaser-game-engines/toolkit/top-down/headless'),
  import('@phaser-game-engines/toolkit/battle/headless'),
  import('@phaser-game-engines/toolkit/content'),
  import('@phaser-game-engines/create-game'),
]);
for (const [name, value] of Object.entries({
  createWorldRuntime: core.createWorldRuntime,
  createTraversalController: platformer.createTraversalController,
  movementFromIntent: topDown.movementFromIntent,
  Battle: battle.Battle,
  validateContent: content.validateContent,
  createProject: generator.createProject,
})) if (typeof value !== 'function') throw new Error(name + ' registry export failed');
`);
  run(process.execPath, ['smoke.mjs'], consumerDirectory);
  runBin('pge-content', ['--help']);
  runBin('create-phaser-game-engines', ['--version']);

  const generatorPath = join(
    consumerDirectory, 'node_modules', '@phaser-game-engines', 'create-game', 'src', 'index.js',
  );
  const { createProject, genres, inputAdapters, languages } = await import(pathToFileURL(generatorPath));
  const sharedModules = join(consumerDirectory, 'node_modules');
  for (const genre of genres) {
    for (const language of languages) {
      const supportedInputs = genre === 'battle' ? ['keyboard'] : inputAdapters;
      for (const input of supportedInputs) {
        const project = join(projectsDirectory, `${genre}-${language}-${input}`);
        createProject({ targetDirectory: project, genre, language, input, packageVersion: version });
        symlinkSync(sharedModules, join(project, 'node_modules'), 'junction');
        run(process.execPath, [join(sharedModules, 'vite', 'bin', 'vite.js'), 'build'], project);
        run(process.execPath, [join(sharedModules, 'vitest', 'vitest.mjs'), 'run'], project);
        if (language === 'ts') {
          run(process.execPath, [join(sharedModules, 'typescript', 'bin', 'tsc'), '--noEmit'], project);
        }
        if (language === 'js' && input === 'keyboard') {
          await verifyPreview(project, sharedModules, genre, 43100 + genres.indexOf(genre));
        }
        console.log(`Verified registry ${genre} ${language.toUpperCase()} ${input} starter.`);
      }
    }
  }
  console.log(`Verified published packages and starters at ${version}.`);
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function assertInstalledVersion(packageName) {
  const manifest = JSON.parse(readFileSync(join(
    consumerDirectory, 'node_modules', ...packageName.split('/'), 'package.json',
  ), 'utf8'));
  if (manifest.version !== version) {
    throw new Error(`${packageName}: expected ${version}, installed ${manifest.version}.`);
  }
}

function assertInstalledBin(command) {
  const suffix = process.platform === 'win32' ? '.cmd' : '';
  if (!existsSync(join(consumerDirectory, 'node_modules', '.bin', `${command}${suffix}`))) {
    throw new Error(`Registry package did not install the ${command} executable.`);
  }
}

function runBin(command, args) {
  const script = command === 'pge-content'
    ? join(consumerDirectory, 'node_modules', '@phaser-game-engines', 'toolkit', 'modules', 'content-tools', 'bin', 'pge-content.js')
    : join(consumerDirectory, 'node_modules', '@phaser-game-engines', 'create-game', 'bin', 'create-game.js');
  run(process.execPath, [script, ...args], consumerDirectory);
}

function runNpm(args, cwd) {
  run(process.execPath, [npmCli, ...args], cwd, { npm_config_cache: npmCache });
}

async function verifyPreview(project, sharedModules, genre, port) {
  const child = spawn(process.execPath, [
    join(sharedModules, 'vite', 'bin', 'vite.js'),
    'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort',
  ], { cwd: project, stdio: 'ignore' });
  try {
    const url = `http://127.0.0.1:${port}/`;
    let lastError;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const response = await fetch(url);
        const html = await response.text();
        if (!response.ok || !html.includes(`${genre} starter`)) {
          throw new Error(`Unexpected preview response for ${genre}.`);
        }
        return;
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    throw lastError ?? new Error(`Timed out starting ${genre} preview.`);
  } finally {
    child.kill();
  }
}

function run(command, args, cwd, extraEnvironment = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...extraEnvironment },
  });
  if (result.status !== 0) {
    throw new Error([
      `${command} ${args.join(' ')} failed with status ${result.status}.`,
      result.stdout,
      result.stderr,
    ].filter(Boolean).join('\n'));
  }
}
