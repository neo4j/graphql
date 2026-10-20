---
"@neo4j/graphql": patch
---

Fix `getSubgraphSchema()` throwing `TypeError: doc.definitions is not iterable` with `@apollo/subgraph` 2.15, which the existing `^2.2.3` range installs. `@apollo/subgraph` 2.14 still works.

With `@apollo/subgraph` 2.15 the printed subgraph schema changes slightly. It no longer has the `@link` to `https://specs.apollo.dev/link/v1.0`, `@federation__external` no longer has a `reason` argument, and `scalar _Any` is left out when there is no `_entities` field.

`@apollo/subgraph` 2.15 needs Node.js 22 or later and `graphql` 16.11 or later. If you can't upgrade those yet, pin `@apollo/subgraph` to `~2.14`.

`@graphql-tools/utils` is updated to `^12.0.0`.
