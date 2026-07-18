export type Genre = 'platformer' | 'top-down' | 'battle';
export type Language = 'js' | 'ts';
export type Recipe = 'minimal' | 'action-adventure';
export type InputAdapter = 'keyboard' | 'gamepad' | 'touch';
export interface CreateProjectOptions {
  targetDirectory: string;
  genre?: Genre;
  language?: Language;
  recipe?: Recipe;
  input?: InputAdapter;
  packageSource?: string;
  packageVersion?: string;
}
export interface CreatedProject {
  readonly targetDirectory: string;
  readonly genre: Genre;
  readonly language: Language;
  readonly recipe: Recipe;
  readonly input: InputAdapter;
  readonly files: string[];
}
export const genres: readonly Genre[];
export const languages: readonly Language[];
export const inputAdapters: readonly InputAdapter[];
export const recipes: Readonly<Record<Genre, readonly Recipe[]>>;
export const usage: string;
export function createProject(options: CreateProjectOptions): CreatedProject;
