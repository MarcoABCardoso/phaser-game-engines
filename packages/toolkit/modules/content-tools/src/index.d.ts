export type ContentKind = 'world' | 'platformer' | 'top-down' | 'action-adventure' | 'assets';
export interface ValidationOptions { kind?: ContentKind; path?: string; types?: string[] }
export interface MigrationOptions { targetVersion?: 1 }
export interface MigrationResult<T = unknown> {
  fromVersion: number; toVersion: 1; changed: boolean; content: T;
}
export interface FileMigrationResult<T = unknown> extends MigrationResult<T> { path: string; written: boolean }
export const contentKinds: readonly ContentKind[];
export function validateContent<T>(content: T, options?: ValidationOptions): T;
export function validateContentFile<T = unknown>(filename: string, options?: Omit<ValidationOptions, 'path'>): T;
export function migrateContent<T>(content: T, options?: MigrationOptions): MigrationResult<T>;
export function migrateContentFile<T = unknown>(filename: string, options?: MigrationOptions & { write?: boolean }): FileMigrationResult<T>;
