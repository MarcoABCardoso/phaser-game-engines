# Support policy

The packages are prerelease software. Versions before `1.0` may change their
public JavaScript APIs, TypeScript declarations, event payloads, content
schemas, and snapshots between minor releases. Breaking changes should still be
called out in `CHANGELOG.md` with a migration example.

## Supported environment

- Node.js 22 and 24 for package tools, headless tests, and simulations.
- Phaser 3.90 for the optional scene adapters.
- ESM projects and modern browsers supported by Phaser 3.90 and Vite 8.

The explicit `/headless` entry point of every package is supported in Node and
must not evaluate Phaser or require browser globals. Package root entry points
for the genre engines include their Phaser scene adapters and are browser-only.

Please use the repository issue tracker for reproducible defects. Include the
package versions, runtime versions, a minimal reproduction, and—when relevant—a
seed and recorded input stream. A formal security and long-term-support policy
will be established before `1.0`.

