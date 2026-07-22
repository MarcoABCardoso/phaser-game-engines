# Support policy

The packages are prerelease software. Versions before `1.0` may change their
public JavaScript APIs, TypeScript declarations, event payloads, content
schemas, and snapshots between minor releases. Breaking changes should still be
called out in `CHANGELOG.md` with a migration example.

## Supported environment

- Node.js 20.19 or newer for package tools, headless tests, and simulations.
  CI exercises Node 20.19, 22, and 24.
- Phaser 4.2.1 or newer within the Phaser 4 major line for the optional scene
  adapters. Phaser 3 is not supported.
- ESM projects and modern WebGL-capable browsers supported by Phaser 4 and
  Vite 8. Generated projects and samples select the WebGL renderer explicitly.

The toolkit's explicit genre `/headless` entry points are supported in Node and
must not evaluate Phaser or require browser globals. The `/platformer`,
`/top-down`, and `/battle` roots include Phaser scene adapters and are
browser-only.

Please use the repository issue tracker for reproducible defects. Include the
package versions, runtime versions, a minimal reproduction, and—when relevant—a
seed and recorded input stream. A formal security and long-term-support policy
will be established before `1.0`.
