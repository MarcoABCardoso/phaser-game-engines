#!/usr/bin/env node
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { createProject, packageVersion, recipes, usage } from '../src/index.js';

try {
  let options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage);
    process.exit(0);
  }
  if (options.version) {
    console.log(packageVersion);
    process.exit(0);
  }
  if (process.stdin.isTTY && process.stdout.isTTY && !options.yes) options = await promptForOptions(options);
  applyDefaults(options);
  const result = createProject(options);
  console.log(`Created ${result.genre} ${result.language.toUpperCase()} ${result.template} starter at ${result.targetDirectory}`);
  console.log(`Next: cd ${result.targetDirectory}\n      npm install\n      npm run dev`);
} catch (error) {
  console.error(error.message);
  console.error(`\n${usage}`);
  process.exitCode = 1;
}

function parseArguments(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') return { help: true };
    if (argument === '--version' || argument === '-v') return { version: true };
    if (argument === '--genre') options.genre = requiredValue(args, ++index, argument);
    else if (argument === '--language') options.language = requiredValue(args, ++index, argument);
    else if (argument === '--template') options.template = requiredValue(args, ++index, argument);
    else if (argument === '--recipe') options.recipe = requiredValue(args, ++index, argument);
    else if (argument === '--input') options.input = requiredValue(args, ++index, argument);
    else if (argument === '--save') options.save = true;
    else if (argument === '--debug') options.debug = true;
    else if (argument === '--replay') options.replay = true;
    else if (argument === '--deploy') options.deploy = requiredValue(args, ++index, argument);
    else if (argument === '--yes' || argument === '-y') options.yes = true;
    else if (argument === '--package-source') options.packageSource = resolve(requiredValue(args, ++index, argument));
    else if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`);
    else if (!options.targetDirectory) options.targetDirectory = resolve(argument);
    else throw new Error(`Unexpected argument: ${argument}`);
  }
  if (!options.targetDirectory && !(process.stdin.isTTY && process.stdout.isTTY)) throw new Error('A target directory is required.');
  return options;
}

function applyDefaults(options) {
  options.genre ??= 'platformer';
  options.language ??= 'js';
  options.template ??= 'recommended';
  options.input ??= 'keyboard';
  options.deploy ??= 'none';
}

async function promptForOptions(options) {
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    options.targetDirectory ??= resolve(await ask(terminal, 'Project directory', 'my-game'));
    options.genre ??= await choose(terminal, 'Genre', ['platformer', 'top-down', 'battle'], 'platformer');
    options.language ??= await choose(terminal, 'Language', ['js', 'ts'], 'js');
    options.template ??= await choose(terminal, 'Template', ['recommended', 'minimal'], 'recommended');
    const availableRecipes = recipes[options.genre];
    options.recipe ??= await choose(terminal, 'Recipe', availableRecipes, options.template === 'minimal' ? 'minimal' : availableRecipes.find((name) => name !== 'minimal'));
    const inputs = options.template === 'minimal' && options.genre === 'battle' ? ['keyboard'] : ['keyboard', 'gamepad', 'touch'];
    options.input ??= await choose(terminal, 'Input', inputs, 'keyboard');
    options.save ??= await confirm(terminal, 'Include local saves?', false);
    options.debug ??= await confirm(terminal, 'Include debug overlay?', false);
    options.replay ??= await confirm(terminal, 'Include input recording/replay?', false);
    options.deploy ??= await choose(terminal, 'Deployment', ['none', 'github-pages', 'static'], 'none');
    return options;
  } finally {
    terminal.close();
  }
}

async function ask(terminal, label, fallback) {
  const answer = (await terminal.question(`${label} (${fallback}): `)).trim();
  return answer || fallback;
}

async function choose(terminal, label, values, fallback) {
  const answer = await ask(terminal, `${label} [${values.join('/')}]`, fallback);
  if (!values.includes(answer)) throw new Error(`${label} must be one of: ${values.join(', ')}.`);
  return answer;
}

async function confirm(terminal, label, fallback) {
  const answer = (await terminal.question(`${label} [${fallback ? 'Y/n' : 'y/N'}]: `)).trim().toLowerCase();
  if (!answer) return fallback;
  if (['y', 'yes'].includes(answer)) return true;
  if (['n', 'no'].includes(answer)) return false;
  throw new Error(`${label} expects yes or no.`);
}

function requiredValue(args, index, option) {
  const value = args[index];
  if (!value || value.startsWith('-')) throw new Error(`${option} requires a value.`);
  return value;
}
