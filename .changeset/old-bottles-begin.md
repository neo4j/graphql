---
"@neo4j/graphql": minor
---

Introduced relationship directive configuration with the new nestedOperations argument. This allows users to specify which nested operations they want to be built into the schema.

Usage:

```graphql
type Movie {
    id: ID
    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE, UPDATE, CONNECT])
}
```
