import type { ContentKind } from './index.js';
export interface ContentValidationEntry { file: string; kind: ContentKind; types?: string[] }
export interface ContentValidationPluginOptions { files?: ContentValidationEntry[] }
export function createContentValidationPlugin(options?: ContentValidationPluginOptions): {
  name: string;
  buildStart(): void;
  handleHotUpdate(context: { file: string; modules: unknown[] }): unknown[] | undefined;
};

