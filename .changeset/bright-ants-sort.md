---
"@neo4j/graphql": minor
---

Introduced top-level schema configuration, `@query`, `@mutation`, `@subscription`.

Usage:

```graphql
type User @query(read:false) @mutation(operations: [CREATE, DELETE]) {
	name: String
}
extend schema @subscription(operations: [CREATE])
```
