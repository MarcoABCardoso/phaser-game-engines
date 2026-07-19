export type Genre = 'platformer' | 'top-down' | 'battle';
export type Language = 'js' | 'ts';
export type Template = 'minimal' | 'recommended';
export type Recipe = 'minimal' | 'precision-platformer' | 'exploration' | 'action-adventure' | 'menu-presentation';
export type InputAdapter = 'keyboard' | 'gamepad' | 'touch';
export type Deployment = 'none' | 'github-pages' | 'static';
export interface CreateProjectOptions {
  targetDirectory: string;
  genre?: Genre;
  language?: Language;
  template?: Template;
  recipe?: Recipe;
  input?: InputAdapter;
  save?: boolean;
  debug?: boolean;
  replay?: boolean;
  deploy?: Deployment;
  packageSource?: string;
  packageVersion?: string;
}
export interface CreatedProject {
  readonly targetDirectory: string;
  readonly genre: Genre;
  readonly language: Language;
  readonly template: Template;
  readonly recipe: Recipe;
  readonly input: InputAdapter;
  readonly save: boolean;
  readonly debug: boolean;
  readonly replay: boolean;
  readonly deploy: Deployment;
  readonly files: string[];
}
export const genres: readonly Genre[];
export const languages: readonly Language[];
export const inputAdapters: readonly InputAdapter[];
export const templates: readonly Template[];
export const optionalFeatures: readonly ('save' | 'debug' | 'replay')[];
export const recipes: Readonly<Record<Genre, readonly Recipe[]>>;
export const packageVersion: string;
export const usage: string;
export function createProject(options: CreateProjectOptions): CreatedProject;
