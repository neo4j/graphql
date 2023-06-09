---
"@neo4j/graphql": minor
---

Add `aggregate` argument to the @relationship directive, allowing to disable nested aggregation

For example:

```graphql
type Actor {
    username: String!
    password: String!
}

type Movie {
    title: String
    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
}
```
