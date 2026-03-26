---
"@neo4j/graphql": minor
---

Add support for single element relationships. For example:

```graphql
type Movie @node {
    title: String!
    actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
    director: Director! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
}
```

It makes possible to model and query the data of single element relationships, with the following constraints:

- If multiple relationships exists, the first one will be returned. The relationship that will be returned will not be guaranteed
- Connections will maintain the many-to-many API, even if it is a single relationship. This is to maintain the relay spec
- Delete mutations will be available for nullable fields
- Create mutations will be available for both, nullable and non-nullable
