---
"@neo4j/graphql": minor
---

Introduced schema configuration directive: `@filterable`.

Usage:

```graphql
type User {
    name: String @filterable(byValue: true, byAggregate: true)
}
```
