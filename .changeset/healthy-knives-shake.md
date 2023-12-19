---
"@neo4j/introspector": major
"@neo4j/graphql": major
"@neo4j/graphql-ogm": major
---

Change @relationshipProperties to target types instead of interfaces:

Instead of defining relationship properties in an interface, they must be defined as a type:

```graphql
type Actor {
    name: String!
    actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}

type ActedIn @relationshipProperties {
    screenTime: Int
}
```
