---
"@neo4j/graphql": major
---

Fails schema validation if a field with `@relationship` targets a type without `@node`.

For example, the following schema will fail:

```graphql
type Movie @node {
    someActors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
}

type Actor {
    name: String
}
```
