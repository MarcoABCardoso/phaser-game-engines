/** Minimal deterministic simulation harness for controller and vertical-slice tests. */
export function createSimulationHarness({ clock, step, snapshot } = {}) {
  if (typeof step !== 'function') throw new TypeError('Simulation harness requires step(input, context).');
  let frame = 0;
  const history = [];
  return Object.freeze({
    advance(input, delta = 16) {
      clock?.advance?.(delta);
      const result = step(input, { frame, delta, time: clock?.now?.() ?? frame * delta });
      history.push({ frame, input: structuredClone(input), result: structuredClone(result) });
      frame += 1;
      return result;
    },
    run(inputs, delta = 16) { return inputs.map((input) => this.advance(input, delta)); },
    snapshot: () => snapshot?.() ?? history.at(-1)?.result ?? null,
    get history() { return structuredClone(history); },
  });
}

/** Measure synchronous work against an explicit budget without choosing an optimizer. */
export function measureBudget(name, operation, { iterations = 1, budgetMs = Infinity, now = () => performance.now() } = {}) {
  const start = now();
  for (let index = 0; index < iterations; index += 1) operation(index);
  const durationMs = now() - start;
  return { name, iterations, durationMs, perIterationMs: durationMs / iterations, budgetMs, passed: durationMs <= budgetMs };
}
