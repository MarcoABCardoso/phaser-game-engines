import type Phaser from 'phaser';

export type ParticipantId = string | number;
export type BattleCommand = { id: string; actorId: ParticipantId; [key: string]: unknown };
export type StateChange =
  | { type: 'set'; path: string | (string | number)[]; value: unknown }
  | { type: 'increment'; path: string | (string | number)[]; value: number }
  | { type: 'append' | 'remove'; path: string | (string | number)[]; value: unknown };
export interface DomainEvent { type: string; detail?: Record<string, unknown> }
export interface ScheduleChange {
  remove?: ParticipantId[]; leave?: ParticipantId[];
  prepend?: ParticipantId[]; next?: ParticipantId[];
  append?: ParticipantId[]; enter?: ParticipantId[]; add?: ParticipantId[];
}
export interface BattleTransaction<GameState = unknown> {
  state?: GameState;
  changes?: StateChange[];
  events?: DomainEvent[];
  effects?: unknown[];
  reactions?: BattleCommand[];
  interrupts?: BattleCommand[];
  schedule?: ScheduleChange;
}
export interface BattleMachine<Outcome = unknown> {
  phase: string;
  round: number;
  activeId: ParticipantId | null;
  queue: ParticipantId[];
  outcome: Outcome | null;
  pipelineIndex: number;
  pendingEffects: unknown[];
  selection: { stageIndex: number; values: Record<string, unknown> } | null;
  cancelled: unknown;
}
export interface BattleState<GameState = unknown, Outcome = unknown> {
  machine: BattleMachine<Outcome>;
  game: GameState;
}
export interface BattleContext<Spec = unknown> {
  machine: BattleMachine;
  rng: (() => number) & { next?: () => number; getState?: () => unknown; setState?: (state: unknown) => void };
  clock: { now(): number; getState?(): unknown; setState?(state: unknown): void };
  spec: Spec;
  rules: BattleRules;
  queueReaction(command: BattleCommand, options?: { interrupt?: boolean }): void;
  scheduleParticipant(id: ParticipantId, options?: { next?: boolean }): void;
  unscheduleParticipant(id: ParticipantId): boolean;
}
export interface CommandStage<GameState = unknown> {
  id: string;
  options?: unknown[] | ((state: GameState, selections: Record<string, unknown>, context: BattleContext) => unknown[]);
  validate?: (value: unknown, state: GameState, context: BattleContext) => boolean;
  [key: string]: unknown;
}
export interface BattleRules<Spec = unknown, GameState = unknown, Outcome = unknown> {
  createInitialState(spec: Spec): GameState;
  getTurnOrder(state: GameState, context: BattleContext<Spec>): ParticipantId[];
  getAvailableCommands(state: GameState, activeId: ParticipantId, context: BattleContext<Spec>): (string | Partial<BattleCommand>)[];
  resolveCommand(state: GameState, command: BattleCommand, context: BattleContext<Spec>): BattleTransaction<GameState> | void;
  getOutcome(state: GameState, context: BattleContext<Spec>): Outcome | null;
  validateCommand?(state: GameState, command: BattleCommand, available: unknown[], context: BattleContext<Spec>): boolean;
  getCommandStages?(state: GameState, activeId: ParticipantId, context: BattleContext<Spec>): CommandStage<GameState>[];
  createCommand?(state: GameState, draft: { actorId: ParticipantId; selections: Record<string, unknown> }, context: BattleContext<Spec>): BattleCommand;
  resolveReaction?(state: GameState, command: BattleCommand, context: BattleContext<Spec>): BattleTransaction<GameState> | void;
  runPhase?(state: GameState, phase: string, context: BattleContext<Spec>): BattleTransaction<GameState> | void;
  onBattleStart?(state: GameState, context: BattleContext<Spec>): BattleTransaction<GameState> | void;
  onTurnStart?(state: GameState, context: BattleContext<Spec>): BattleTransaction<GameState> | void;
  onTurnEnd?(state: GameState, context: BattleContext<Spec>): BattleTransaction<GameState> | void;
}
export interface PhaseEntry {
  id: string; phase?: string; event?: string; hook?: string;
  pause?: 'command'; run?: 'resolve';
  handler?: (state: unknown, phase: string, context: BattleContext) => BattleTransaction | void;
}
export interface BattleSnapshot<GameState = unknown, Outcome = unknown> {
  version: number;
  data: { state: BattleState<GameState, Outcome>; [key: string]: unknown };
}

export const BATTLE_SNAPSHOT_VERSION: number;
export const DEFAULT_PHASE_PIPELINE: readonly Readonly<PhaseEntry>[];
export function createRoundScheduler(): {
  createSchedule(state: unknown, context: BattleContext): ParticipantId[];
  next(schedule: ParticipantId[], context?: BattleContext): ParticipantId | null;
};
export function applyScheduleChange(schedule: ParticipantId[], change?: ScheduleChange): ParticipantId[];
export function applyChanges<T>(state: T, changes?: StateChange[]): T;
export function updateAtPath<T>(value: T, path: (string | number)[], updater: (value: unknown) => unknown): T;

export class Battle<Spec = unknown, GameState = unknown, Outcome = unknown> {
  constructor(spec: Spec, options: {
    rules: BattleRules<Spec, GameState, Outcome>;
    emit?: (type: string, payload: Record<string, unknown> & { state: BattleState<GameState, Outcome> }) => void;
    rng?: (() => number) | { next(): number; getState?(): unknown; setState?(state: unknown): void };
    clock?: { now(): number; getState?(): unknown; setState?(state: unknown): void };
    pipeline?: (string | PhaseEntry)[];
    scheduler?: ReturnType<typeof createRoundScheduler>;
    recorder?: { recordBattleCommand(command: BattleCommand): unknown };
    snapshot?: BattleSnapshot<GameState, Outcome>;
    snapshotMigrations?: Record<number, (data: unknown) => unknown>;
  });
  state: BattleState<GameState, Outcome>;
  rules: BattleRules<Spec, GameState, Outcome>;
  start(): ParticipantId | null;
  advance(): ParticipantId | null;
  availableCommands(): unknown[];
  submitCommand(command: BattleCommand): ParticipantId | null;
  submitSelection(value: unknown): ParticipantId | null;
  queueReaction(command: BattleCommand, options?: { interrupt?: boolean }): void;
  completeEffect(): unknown;
  resume(): unknown;
  scheduleParticipant(id: ParticipantId, options?: { next?: boolean }): void;
  unscheduleParticipant(id: ParticipantId): boolean;
  cancel(reason?: unknown): boolean;
  snapshot(): BattleSnapshot<GameState, Outcome>;
  restore(snapshot: BattleSnapshot<GameState, Outcome>, options?: { publish?: boolean }): BattleState<GameState, Outcome>;
  debugState(): Record<string, unknown>;
}

export class BattleScene extends Phaser.Scene {
  battle: Battle;
  getBattle(): unknown;
  getBattleRules(): BattleRules;
  onBattleEvent(type: string, payload: unknown): void;
  renderBattleState(state: BattleState): void;
}
