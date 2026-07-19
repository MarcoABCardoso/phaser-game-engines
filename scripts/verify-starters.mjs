import { mkdtempSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createProject, genres, inputAdapters, languages } from '../packages/create-game/src/index.js';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const temporaryRoot = mkdtempSync(join(tmpdir(), 'phaser-game-starters-'));

try {
  for (const template of ['minimal', 'recommended']) {
    for (const genre of genres) {
      for (const language of languages) {
        const supportedInputs = template === 'minimal' && genre === 'battle' ? ['keyboard'] : inputAdapters;
        for (const input of supportedInputs) {
          const project = join(temporaryRoot, `${template}-${genre}-${language}-${input}`);
          const includeFeatures = template === 'recommended' && genre === 'platformer' && input === 'keyboard';
          createProject({
            targetDirectory: project, genre, language, template, input,
            save: includeFeatures, debug: includeFeatures, replay: includeFeatures,
            packageSource: root,
          });
        symlinkSync(join(root, 'node_modules'), join(project, 'node_modules'), 'junction');
        run(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], project);
        run(process.execPath, [join(root, 'node_modules', 'vitest', 'vitest.mjs'), 'run'], project);
        if (language === 'ts') {
          run(process.execPath, [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '--noEmit'], project);
        }
          console.log(`Verified ${template} ${genre} ${language.toUpperCase()} ${input} starter.`);
        }
      }
    }
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error([`${command} ${args.join(' ')} failed.`, result.stdout, result.stderr].filter(Boolean).join('\n'));
  }
}
