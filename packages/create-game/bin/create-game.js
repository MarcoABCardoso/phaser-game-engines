#!/usr/bin/env node
import { resolve } from 'node:path';
import { createProject, usage } from '../src/index.js';

try {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage);
    process.exit(0);
  }
  const result = createProject(options);
  console.log(`Created ${result.genre} ${result.language.toUpperCase()} starter at ${result.targetDirectory}`);
  console.log(`Next: cd ${result.targetDirectory}\n      npm install\n      npm run dev`);
} catch (error) {
  console.error(error.message);
  console.error(`\n${usage}`);
  process.exitCode = 1;
}

function parseArguments(args) {
  const options = { genre: 'platformer', language: 'js', recipe: 'minimal', input: 'keyboard' };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') return { help: true };
    if (argument === '--genre') options.genre = requiredValue(args, ++index, argument);
    else if (argument === '--language') options.language = requiredValue(args, ++index, argument);
    else if (argument === '--recipe') options.recipe = requiredValue(args, ++index, argument);
    else if (argument === '--input') options.input = requiredValue(args, ++index, argument);
    else if (argument === '--package-source') options.packageSource = resolve(requiredValue(args, ++index, argument));
    else if (argument.startsWith('-')) throw new Error(`Unknown option: ${argument}`);
    else if (!options.targetDirectory) options.targetDirectory = resolve(argument);
    else throw new Error(`Unexpected argument: ${argument}`);
  }
  if (!options.targetDirectory) throw new Error('A target directory is required.');
  return options;
}

function requiredValue(args, index, option) {
  const value = args[index];
  if (!value || value.startsWith('-')) throw new Error(`${option} requires a value.`);
  return value;
}
