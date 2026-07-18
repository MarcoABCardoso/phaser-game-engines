# Contributing

Use Node 22 or 24 and install dependencies with `npm ci`.

Run `npm run verify` before submitting a change. Deterministic behavior belongs
in small Phaser-free modules with Vitest coverage; scenes should adapt input,
presentation, physics, and lifecycle to that logic.

Public features must be exported intentionally, documented, and represented in
the generated declarations. A reusable mechanic needs two materially different
consumers before it is promoted into shared infrastructure.

See `AGENTS.md` for repository-specific architecture and `ROADMAP.md` for the
current product priorities.

