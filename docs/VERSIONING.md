# Versioning policy

Before `1.0`, breaking API improvements are allowed in minor releases and need
a changelog entry. The repository intentionally carries no deprecated facade
for its prototype-era APIs.

At `1.0`, semantic versioning covers runtime JavaScript exports, TypeScript
declarations, documented lifecycle event names and payloads, JSON schemas,
snapshot versions, and named recipe ownership/behavior. Breaking changes to any
of those require a major version. Additive APIs and optional schema fields are
minor changes; fixes that preserve documented behavior are patches.

Persisted schemas and snapshots use their own integer version. Readers reject
newer versions and require an explicit sequential migration for older versions.
