// The engine owns phase transitions and event sequencing. Game rules own all
// domain data and return transactions: { state?, changes?, events? }.
import { applyChanges } from './state.js';

export default class BattleController {
  constructor(spec, { rules, emit = () => {}, rng = Math.random } = {}) {
    if (!rules) throw new Error('BattleController requires a rules adapter.');
    this.spec = spec; this.rules = rules; this.emit = emit; this.rng = rng;
    this.state = { machine: { phase: 'idle', round: 0, activeId: null, queue: [], outcome: null }, game: rules.createInitialState(spec) };
  }
  start() {
    this.transition('starting'); this.publish('battleStarted');
    this.applyHook('onBattleStart'); return this.advance();
  }
  advance() {
    if (this.finishIfNeeded()) return null;
    if (!this.state.machine.queue.length) { this.state.machine.round += 1; this.state.machine.queue = [...this.rules.getTurnOrder(this.state.game, this.context())]; this.publish('roundStarted'); }
    const activeId = this.state.machine.queue.shift();
    if (activeId == null) throw new Error('Rules returned an empty turn order for an unfinished battle.');
    this.state.machine.activeId = activeId; this.transition('turn-start'); this.publish('turnStarted'); this.applyHook('onTurnStart');
    if (this.finishIfNeeded()) return null;
    this.transition('command-selection'); this.publish('commandRequested', { commands: this.availableCommands() });
    return activeId;
  }
  availableCommands() { return this.rules.getAvailableCommands(this.state.game, this.state.machine.activeId, this.context()) ?? []; }
  submitCommand(command) {
    if (this.state.machine.phase !== 'command-selection') throw new Error('Commands can only be submitted during command selection.');
    if (command.actorId !== this.state.machine.activeId) throw new Error('Only the active participant may submit a command.');
    const commands = this.availableCommands();
    if (this.rules.validateCommand && !this.rules.validateCommand(this.state.game, command, commands, this.context())) throw new Error('Command is not valid in this battle state.');
    this.transition('resolving'); this.publish('commandSubmitted', { command }); this.publish('beforeResolve', { command });
    this.applyTransaction(this.rules.resolveCommand(this.state.game, command, this.context()), { command });
    this.publish('afterResolve', { command });
    if (this.finishIfNeeded()) return null;
    this.transition('turn-end'); this.publish('turnEnded', { command }); this.applyHook('onTurnEnd', { command });
    if (this.finishIfNeeded()) return null;
    this.state.machine.activeId = null; return this.advance();
  }
  applyHook(name, detail = {}) { if (this.rules[name]) this.applyTransaction(this.rules[name](this.state.game, this.context()), detail); }
  applyTransaction(transaction, detail = {}) {
    if (!transaction) return;
    const previous = this.state.game;
    if (transaction.state !== undefined) this.state.game = transaction.state;
    else if (transaction.changes) this.state.game = applyChanges(previous, transaction.changes);
    if (this.state.game !== previous || transaction.changes?.length) this.publish('stateChanged', { ...detail, changes: transaction.changes ?? [] });
    for (const event of transaction.events ?? []) this.publish(event.type, { ...detail, ...(event.detail ?? {}) });
  }
  finishIfNeeded() {
    const outcome = this.rules.getOutcome(this.state.game, this.context());
    if (outcome == null) return false;
    this.state.machine.outcome = outcome; this.state.machine.activeId = null; this.transition('finished'); this.publish('battleEnded', { outcome }); return true;
  }
  transition(phase) { this.state.machine.phase = phase; this.publish('phaseChanged', { phase }); }
  context() { return { machine: this.state.machine, rng: this.rng, spec: this.spec }; }
  publish(type, detail = {}) { this.emit(type, { type, state: this.state, ...detail }); }
}
