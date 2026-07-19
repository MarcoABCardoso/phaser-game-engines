#!/usr/bin/env node
import { migrateContentFile, validateContentFile } from '../src/index.js';

const usage = `Usage:
  pge-content validate <files...> --kind world|platformer|top-down|action-adventure|assets [--types name,...]
  pge-content migrate <files...> [--write]

Migration is a dry run unless --write is supplied.`;

try {
  const { command, files, options } = parse(process.argv.slice(2));
  if (command === 'help') {
    console.log(usage);
  } else if (command === 'validate') {
    for (const file of files) {
      validateContentFile(file, options);
      console.log(`valid ${file}`);
    }
  } else {
    for (const file of files) {
      const result = migrateContentFile(file, options);
      if (!options.write) console.log(JSON.stringify(result.content, null, 2));
      console.error(`${result.changed ? 'migration available' : 'already current'} ${file}${result.written ? ' (written)' : ''}`);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

function parse(args) {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) return { command: 'help', files: [], options: {} };
  const command = args.shift();
  if (!['validate', 'migrate'].includes(command)) throw new Error(`Unknown command ${JSON.stringify(command)}.\n${usage}`);
  const files = [];
  const options = {};
  while (args.length) {
    const value = args.shift();
    if (value === '--kind') options.kind = required(args, value);
    else if (value === '--types') options.types = required(args, value).split(',').filter(Boolean);
    else if (value === '--write') options.write = true;
    else if (value.startsWith('-')) throw new Error(`Unknown option ${value}.`);
    else files.push(value);
  }
  if (!files.length) throw new Error(`At least one content file is required.\n${usage}`);
  if (command === 'validate' && !options.kind) options.kind = 'world';
  return { command, files, options };
}

function required(args, option) {
  const value = args.shift();
  if (!value || value.startsWith('-')) throw new Error(`${option} requires a value.`);
  return value;
}
