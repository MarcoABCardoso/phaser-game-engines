# Choosing a toolkit subpath

Install `@phaser-game-engines/toolkit` once, then import the smallest subpath
that owns the orchestration you need.

| Need | Choose | Why |
| --- | --- | --- |
| Device-independent input, entities, lifecycle, schemas, saves, RNG, or replay | `@phaser-game-engines/toolkit/core` | It is Phaser-free and does not choose a genre |
| A Phaser Arcade Physics platformer | `@phaser-game-engines/toolkit/platformer` | `PlatformerScene` adapts world data and traversal to Phaser |
| Platformer movement in tests, another renderer, or custom physics adaptation | `@phaser-game-engines/toolkit/platformer/headless` | It exports only traversal and transition controllers |
| A Phaser Arcade Physics overhead game | `@phaser-game-engines/toolkit/top-down` | `TopDownScene` owns movement, walls, entities, actions, and portals |
| Overhead movement calculations without Phaser | `@phaser-game-engines/toolkit/top-down/headless` | It exports deterministic movement and geometry helpers |
| Any phase/turn-driven contest, battle, negotiation, or puzzle | `@phaser-game-engines/toolkit/battle/headless` | `Battle` owns scheduling and lifecycle while the game owns all rules |
| A Phaser menu around a turn-based controller | `@phaser-game-engines/toolkit/battle` | It adds the optional `BattleScene` adapter |
| A new runnable project | `@phaser-game-engines/create-game` | It generates a minimal game and headless test |

## Scene, controller, mechanic, or recipe?

- Use a **scene** when the supplied Phaser lifecycle and physics adaptation match
  the game.
- Use a **controller** when the game needs deterministic decisions but owns its
  own renderer, scene structure, or simulation loop.
- Use a **mechanic** for one independently installable behavior with explicit
  cleanup.
- Use a **recipe** for an opinionated but replaceable composition of mechanics.

Recipes are conveniences, not required schemas. Start minimal and add one only
when its complete loop matches the game.

## Import boundary

Use genre roots in browser scenes. Use `/headless` in Node, tests, tools, and
simulations. Use documented subpaths only when composing an extension point not
available from those entry points. Do not import `src/` files through relative
filesystem paths.
