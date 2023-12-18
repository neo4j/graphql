---
"@neo4j/graphql": major
---

Change @relationshipProperties to target types instead of interfaces:

Instead of defining relationship in an interface, now they must be defined as a type:

```graphql
type Actor {
    name: String!
    actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}

type ActedIn @relationshipProperties {
    screenTime: Int
}
```
