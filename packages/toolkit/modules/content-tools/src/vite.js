import { resolve } from 'node:path';
import { validateContentFile } from './index.js';

/** Validate configured content on build and before Vite applies a hot update. */
export function createContentValidationPlugin({ files = [] } = {}) {
  const configured = files.map((entry, index) => {
    if (!entry?.file) throw new TypeError(`contentValidation.files[${index}].file is required.`);
    return { ...entry, file: resolve(entry.file) };
  });
  function validate(entry) {
    return validateContentFile(entry.file, { kind: entry.kind, types: entry.types });
  }
  return {
    name: 'phaser-game-engines-content-validation',
    buildStart() { for (const entry of configured) validate(entry); },
    handleHotUpdate(context) {
      const entry = configured.find((candidate) => candidate.file === resolve(context.file));
      if (!entry) return;
      validate(entry);
      return context.modules;
    },
  };
}

