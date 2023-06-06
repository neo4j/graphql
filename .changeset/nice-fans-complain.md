---
"@neo4j/graphql": minor
---

Add @settable directive, allowing to disable some fields from mutation operations

For example:

```graphql
type Movie {
    title: String!
    description: String @settable(onCreate: true, onUpdate: false)
}
```
