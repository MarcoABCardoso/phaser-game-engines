import { performance } from 'node:perf_hooks';
import {
  EntityStore,
  WorldEntity,
  captureSessionSnapshot,
  entitiesInRect,
  measureBudget,
} from '@phaser-game-engines/toolkit/core';

class BenchmarkEntity extends WorldEntity {
  update() { this.ticks = (this.ticks ?? 0) + 1; }
}

const registry = { benchmark: BenchmarkEntity };
const store = new EntityStore(registry);
store.build({}, Array.from({ length: 1000 }, (_, index) => ({ type: 'benchmark', id: `entity-${index}`, x: index, y: index, w: 1, h: 1 })));
const boxes = Array.from({ length: 1000 }, (_, index) => ({ x: index, y: index, w: 8, h: 8 }));
const now = () => performance.now();
const results = [
  measureBudget('1,000 entity updates', () => store.update({}, 0, 16), { iterations: 100, budgetMs: 200, now }),
  measureBudget('1,000-item spatial query', () => entitiesInRect(boxes, { x: 200, y: 200, w: 100, h: 100 }), { iterations: 100, budgetMs: 100, now }),
];
const snapshot = captureSessionSnapshot({ entities: boxes });
const snapshotBytes = Buffer.byteLength(JSON.stringify(snapshot));

for (const result of results) {
  console.log(`${result.name}: ${result.perIterationMs.toFixed(3)} ms/iteration (${result.passed ? 'within' : 'over'} budget)`);
}
console.log(`Representative snapshot: ${snapshotBytes} bytes (${snapshotBytes <= 100_000 ? 'within' : 'over'} 100 KB budget)`);
if (results.some((result) => !result.passed) || snapshotBytes > 100_000) process.exitCode = 1;
