---
"@neo4j/graphql": patch
---

Fix `getSubgraphSchema()` throwing `TypeError: doc.definitions is not iterable` when `@apollo/subgraph` 2.15 is installed. `@apollo/subgraph` is now limited to `>=2.2.3 <2.15.0`, because 2.15 needs Node.js 22 or later and `graphql` 16.11 or later.

`@graphql-tools/utils` is updated to `12.1.0`.
