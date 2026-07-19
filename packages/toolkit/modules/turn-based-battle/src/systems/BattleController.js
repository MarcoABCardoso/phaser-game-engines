// Phaser-free orchestration. Rules own every domain field and decision.
import { applyChanges } from './state.js';
import { applyScheduleChange, createRoundScheduler } from './scheduler.js';

export const BATTLE_SNAPSHOT_VERSION = 1;

export const DEFAULT_PHASE_PIPELINE = Object.freeze([
  Object.freeze({ id: 'turn-start', event: 'turnStarted', hook: 'onTurnStart' }),
  Object.freeze({ id: 'command-selection', event: 'commandRequested', pause: 'command' }),
  Object.freeze({ id: 'resolution', phase: 'resolving', run: 'resolve' }),
  Object.freeze({ id: 'turn-end', event: 'turnEnded', hook: 'onTurnEnd' }),
]);

const clone = (value) => value === undefined ? undefined : structuredClone(value);

function normalizePipeline(pipeline) {
  if (!Array.isArray(pipeline) || !pipeline.length) throw new TypeError('Battle phase pipeline must be a non-empty array.');
  const entries = pipeline.map((entry) => typeof entry === 'string' ? { id: entry } : { ...entry });
  for (const entry of entries) {
    if (typeof entry.id !== 'string' || !entry.id) throw new TypeError('Every battle phase requires a non-empty id.');
  }
  if (!entries.some((entry) => entry.pause === 'command' || entry.id === 'command-selection')) {
    throw new Error('Battle phase pipeline requires a command-selection phase.');
  }
  if (!entries.some((entry) => entry.run === 'resolve' || entry.id === 'resolution')) {
    throw new Error('Battle phase pipeline requires a resolution phase.');
  }
  return entries;
}

function toRng(rng) {
  if (typeof rng === 'function') return rng;
  if (typeof rng?.next === 'function') {
    const callable = () => rng.next();
    callable.next = callable;
    callable.getState = rng.getState?.bind(rng);
    callable.setState = rng.setState?.bind(rng);
    return callable;
  }
  throw new TypeError('Battle RNG must be a function or expose next().');
}

function templateMatches(command, template) {
  if (typeof template === 'string') return command.id === template;
  if (!template || typeof template !== 'object') return false;
  return Object.entries(template).every(([key, value]) => {
    try { return JSON.stringify(command[key]) === JSON.stringify(value); } catch { return command[key] === value; }
  });
}

export default class BattleController {
  constructor(spec, {
    rules,
    emit = () => {},
    rng = Math.random,
    clock = { now: () => Date.now() },
    pipeline = DEFAULT_PHASE_PIPELINE,
    scheduler = createRoundScheduler(),
    recorder = null,
    snapshot = null,
    snapshotMigrations = {},
  } = {}) {
    if (!rules) throw new Error('BattleController requires a rules adapter.');
    if (typeof clock?.now !== 'function') throw new TypeError('Battle clock must expose now().');
    if (typeof scheduler?.createSchedule !== 'function' || typeof scheduler?.next !== 'function') {
      throw new TypeError('Battle scheduler must expose createSchedule() and next().');
    }
    this.spec = spec;
    this.rules = rules;
    this.emit = emit;
    this.rng = toRng(rng);
    this.clock = clock;
    this.pipeline = normalizePipeline(pipeline);
    this.scheduler = scheduler;
    this.recorder = recorder;
    this.snapshotMigrations = snapshotMigrations;
    this.state = {
      machine: {
        phase: 'idle', round: 0, activeId: null, queue: [], outcome: null,
        pipelineIndex: -1, pendingEffects: [], selection: null, cancelled: null,
      },
      game: rules.createInitialState(spec),
    };
    this.pendingCommand = null;
    this.interrupts = [];
    this.reactions = [];
    this.continuation = null;
    if (snapshot) this.restore(snapshot, { publish: false });
  }

  start() {
    if (this.state.machine.phase !== 'idle') throw new Error('Battle can only start from the idle phase.');
    this.transition('starting');
    this.publish('battleStarted');
    this.applyHook('onBattleStart');
    return this.advance();
  }

  advance() {
    this.assertRunning();
    if (this.continuation) return null;
    if (this.finishIfNeeded()) return null;
    if (this.state.machine.activeId == null) this.beginScheduledTurn();
    return this.runPipeline();
  }

  beginScheduledTurn() {
    const machine = this.state.machine;
    while (!machine.queue.length) {
      machine.round += 1;
      machine.queue = [...this.scheduler.createSchedule(this.state.game, this.context())];
      this.publish('roundStarted', { round: machine.round, schedule: [...machine.queue] });
      if (!machine.queue.length) throw new Error('Rules returned an empty schedule for an unfinished battle.');
    }
    const activeId = this.scheduler.next(machine.queue, this.context());
    if (activeId == null) throw new Error('Battle scheduler returned no participant for an unfinished battle.');
    machine.activeId = activeId;
    machine.pipelineIndex = -1;
    machine.selection = null;
  }

  runPipeline() {
    const machine = this.state.machine;
    while (!this.continuation && machine.activeId != null && ++machine.pipelineIndex < this.pipeline.length) {
      const entry = this.pipeline[machine.pipelineIndex];
      this.transition(entry.phase ?? entry.id);
      if (entry.event) this.publish(entry.event, this.phaseDetail(entry));
      this.applyHook(entry.hook, { phase: entry.id });
      const handler = entry.handler ?? this.rules.runPhase;
      if (handler) this.applyTransaction(handler(this.state.game, entry.id, this.context()), { phase: entry.id });
      if (this.finishIfNeeded()) return null;
      if (entry.pause === 'command' || entry.id === 'command-selection') {
        this.requestCommand();
        return machine.activeId;
      }
      if (entry.run === 'resolve' || entry.id === 'resolution') this.resolvePendingCommand();
    }
    if (this.continuation || this.isTerminal()) return null;
    machine.activeId = null;
    machine.pipelineIndex = -1;
    machine.selection = null;
    this.pendingCommand = null;
    return this.advance();
  }

  phaseDetail(entry) {
    if (entry.pause === 'command' || entry.id === 'command-selection') {
      return { commands: this.availableCommands() };
    }
    return { phase: entry.id, command: this.pendingCommand };
  }

  availableCommands() {
    return this.rules.getAvailableCommands(this.state.game, this.state.machine.activeId, this.context()) ?? [];
  }

  requestCommand() {
    const stages = this.rules.getCommandStages?.(
      this.state.game,
      this.state.machine.activeId,
      this.context(),
    ) ?? [];
    if (stages.length) {
      this.state.machine.selection = { stageIndex: 0, values: {} };
      this.publishSelectionRequested(stages);
    }
  }

  publishSelectionRequested(stages = this.commandStages()) {
    const selection = this.state.machine.selection;
    const stage = stages[selection.stageIndex];
    this.publish('commandSelectionRequested', {
      stage,
      stageIndex: selection.stageIndex,
      selections: clone(selection.values),
    });
  }

  commandStages() {
    return this.rules.getCommandStages?.(
      this.state.game,
      this.state.machine.activeId,
      this.context(),
    ) ?? [];
  }

  submitSelection(value) {
    this.assertCommandPhase();
    const selection = this.state.machine.selection;
    if (!selection) throw new Error('This command does not use staged selection.');
    const stages = this.commandStages();
    const stage = stages[selection.stageIndex];
    if (!stage) throw new Error('No command selection stage is active.');
    const options = typeof stage.options === 'function'
      ? stage.options(this.state.game, clone(selection.values), this.context())
      : (stage.options ?? []);
    const valid = !options.length || options.some((option) => {
      const candidate = option?.value ?? option?.id ?? option;
      return JSON.stringify(candidate) === JSON.stringify(value);
    });
    if (!valid || (stage.validate && stage.validate(value, this.state.game, this.context()) === false)) {
      throw new Error(`Selection is not valid for stage ${stage.id}.`);
    }
    selection.values[stage.id] = clone(value);
    this.publish('commandSelectionSubmitted', { stage, value: clone(value) });
    selection.stageIndex += 1;
    if (selection.stageIndex < stages.length) {
      this.publishSelectionRequested(stages);
      return null;
    }
    const draft = { actorId: this.state.machine.activeId, selections: clone(selection.values) };
    const command = this.rules.createCommand
      ? this.rules.createCommand(this.state.game, draft, this.context())
      : { actorId: draft.actorId, ...draft.selections };
    return this.submitCommand(command);
  }

  submitCommand(command) {
    this.assertCommandPhase();
    this.validateCommand(command);
    this.recorder?.recordBattleCommand?.(command);
    this.pendingCommand = clone(command);
    this.publish('commandSubmitted', { command: this.pendingCommand });
    return this.runPipeline();
  }

  validateCommand(command) {
    if (!command || typeof command !== 'object' || Array.isArray(command)) throw new TypeError('Command must be an object.');
    if (typeof command.id !== 'string' || !command.id) throw new Error('Command requires a non-empty id.');
    if (command.actorId !== this.state.machine.activeId) throw new Error('Only the active participant may submit a command.');
    const commands = this.availableCommands();
    if (!commands.some((available) => templateMatches(command, available))) {
      throw new Error('Command is not available in this battle state.');
    }
    if (this.rules.validateCommand && this.rules.validateCommand(
      this.state.game, command, commands, this.context(),
    ) === false) throw new Error('Command is not valid in this battle state.');
    return true;
  }

  resolvePendingCommand() {
    const command = this.pendingCommand;
    if (!command) throw new Error('Resolution phase reached without a submitted command.');
    this.publish('beforeResolve', { command });
    this.applyTransaction(this.rules.resolveCommand(this.state.game, command, this.context()), { command });
    while (this.interrupts.length || this.reactions.length) {
      const reaction = this.interrupts.shift() ?? this.reactions.shift();
      this.publish('reactionStarted', { command: reaction });
      const resolver = this.rules.resolveReaction ?? this.rules.resolveCommand;
      this.applyTransaction(resolver(this.state.game, reaction, this.context()), { command: reaction, reaction: true });
      this.publish('reactionEnded', { command: reaction });
    }
    this.publish('afterResolve', { command });
    if (this.state.machine.pendingEffects.length) {
      this.continuation = 'pipeline';
      this.transition('presentation');
      this.publish('effectRequested', { effect: this.state.machine.pendingEffects[0] });
    }
  }

  queueReaction(command, { interrupt = false } = {}) {
    if (!command || typeof command !== 'object') throw new TypeError('Reaction must be a command object.');
    (interrupt ? this.interrupts : this.reactions).push(clone(command));
    this.publish(interrupt ? 'interruptQueued' : 'reactionQueued', { command });
  }

  completeEffect() {
    if (this.state.machine.phase !== 'presentation' || !this.continuation) {
      throw new Error('No presentation effect is awaiting completion.');
    }
    const effect = this.state.machine.pendingEffects.shift();
    this.publish('effectCompleted', { effect });
    if (this.state.machine.pendingEffects.length) {
      this.publish('effectRequested', { effect: this.state.machine.pendingEffects[0] });
      return this.state.machine.pendingEffects[0];
    }
    this.continuation = null;
    if (this.finishIfNeeded()) return null;
    return this.runPipeline();
  }

  resume() { return this.completeEffect(); }

  scheduleParticipant(id, { next = false } = {}) {
    this.state.machine.queue = applyScheduleChange(this.state.machine.queue, next ? { prepend: [id] } : { append: [id] });
    this.publish('scheduleChanged', { schedule: [...this.state.machine.queue] });
  }

  unscheduleParticipant(id) {
    const before = this.state.machine.queue.length;
    this.state.machine.queue = applyScheduleChange(this.state.machine.queue, { remove: [id] });
    if (before !== this.state.machine.queue.length) this.publish('scheduleChanged', { schedule: [...this.state.machine.queue] });
    return before !== this.state.machine.queue.length;
  }

  applyHook(name, detail = {}) {
    if (name && this.rules[name]) this.applyTransaction(this.rules[name](this.state.game, this.context()), detail);
  }

  applyTransaction(transaction, detail = {}) {
    if (!transaction) return;
    const previous = this.state.game;
    if (transaction.state !== undefined) this.state.game = transaction.state;
    else if (transaction.changes) this.state.game = applyChanges(previous, transaction.changes);
    if (this.state.game !== previous || transaction.changes?.length) {
      this.publish('stateChanged', { ...detail, changes: transaction.changes ?? [] });
    }
    if (transaction.schedule) {
      this.state.machine.queue = applyScheduleChange(this.state.machine.queue, transaction.schedule);
      this.publish('scheduleChanged', { schedule: [...this.state.machine.queue] });
    }
    for (const command of transaction.interrupts ?? []) this.queueReaction(command, { interrupt: true });
    for (const command of transaction.reactions ?? []) this.queueReaction(command);
    for (const effect of transaction.effects ?? []) {
      this.state.machine.pendingEffects.push(clone(effect));
      this.publish('effectQueued', { effect });
    }
    for (const event of transaction.events ?? []) this.publish(event.type, { ...detail, ...(event.detail ?? {}) });
  }

  finishIfNeeded() {
    if (this.isTerminal()) return true;
    const outcome = this.rules.getOutcome(this.state.game, this.context());
    if (outcome == null) return false;
    this.state.machine.outcome = outcome;
    this.state.machine.activeId = null;
    this.continuation = null;
    this.transition('finished');
    this.publish('battleEnded', { outcome });
    return true;
  }

  cancel(reason = null) {
    if (this.isTerminal()) return false;
    this.state.machine.cancelled = reason ?? true;
    this.state.machine.activeId = null;
    this.state.machine.pendingEffects = [];
    this.pendingCommand = null;
    this.continuation = null;
    this.transition('cancelled');
    this.publish('battleCancelled', { reason });
    return true;
  }

  snapshot() {
    return {
      version: BATTLE_SNAPSHOT_VERSION,
      data: clone({
        state: this.state,
        pendingCommand: this.pendingCommand,
        interrupts: this.interrupts,
        reactions: this.reactions,
        continuation: this.continuation,
        rng: this.rng.getState?.(),
        clock: this.clock.getState?.(),
      }),
    };
  }

  restore(snapshot, { publish = true } = {}) {
    if (!snapshot || !Number.isInteger(snapshot.version) || !('data' in snapshot)) {
      throw new TypeError('Battle snapshot must be { version, data }.');
    }
    if (snapshot.version > BATTLE_SNAPSHOT_VERSION) throw new Error('Battle snapshot is newer than this controller.');
    let version = snapshot.version;
    let data = clone(snapshot.data);
    while (version < BATTLE_SNAPSHOT_VERSION) {
      const migrate = this.snapshotMigrations[version];
      if (typeof migrate !== 'function') throw new Error(`Missing battle snapshot migration from version ${version}.`);
      data = migrate(data);
      version += 1;
    }
    if (!data?.state?.machine || !('game' in data.state)) throw new TypeError('Battle snapshot data is invalid.');
    this.state = data.state;
    this.pendingCommand = data.pendingCommand ?? null;
    this.interrupts = data.interrupts ?? [];
    this.reactions = data.reactions ?? [];
    this.continuation = data.continuation ?? null;
    if (data.rng !== undefined) {
      if (!this.rng.setState) throw new Error('Snapshot contains RNG state but this RNG cannot restore it.');
      this.rng.setState(data.rng);
    }
    if (data.clock !== undefined) {
      if (!this.clock.setState) throw new Error('Snapshot contains clock state but this clock cannot restore it.');
      this.clock.setState(data.clock);
    }
    if (publish) this.publish('battleRestored', { version });
    return this.state;
  }

  debugState() {
    return clone({
      machine: this.state.machine,
      pendingCommand: this.pendingCommand,
      effects: this.state.machine.pendingEffects,
      pipeline: this.pipeline.map((entry) => entry.id),
    });
  }

  transition(phase) {
    const previousPhase = this.state.machine.phase;
    this.state.machine.phase = phase;
    this.publish('phaseChanged', { phase, previousPhase });
  }

  context() {
    return {
      machine: this.state.machine,
      rng: this.rng,
      clock: this.clock,
      spec: this.spec,
      rules: this.rules,
      queueReaction: (command, options) => this.queueReaction(command, options),
      scheduleParticipant: (id, options) => this.scheduleParticipant(id, options),
      unscheduleParticipant: (id) => this.unscheduleParticipant(id),
    };
  }

  publish(type, detail = {}) {
    this.emit(type, { type, time: this.clock.now(), state: this.state, ...detail });
  }

  assertCommandPhase() {
    if (this.state.machine.phase !== 'command-selection' || this.continuation) {
      throw new Error('Commands can only be submitted during command selection.');
    }
  }

  assertRunning() {
    if (this.isTerminal()) throw new Error('Battle has already ended or been cancelled.');
  }

  isTerminal() { return this.state.machine.phase === 'finished' || this.state.machine.phase === 'cancelled'; }
}
