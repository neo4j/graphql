---
"@neo4j/graphql": patch
---

Add `unsafeEscapeOptions` to `Neo4jGraphQL` features with the following flags:

- `disableRelationshipTypeEscaping` (default to `false`)
- `disableNodeLabelEscaping` (defaults to `false`)

These flags remove the automatic escaping of node labels and relationship types in the generated Cypher.

For example, given the following schema:

```graphql
type Actor {
    name: String!
}

type Movie {
    title: String!
    actors: [Actor!]! @relationship(type: "ACTED IN", direction: OUT)
}
```

A GraphQL query going through the `actors` relationship:

```graphql
query {
    movies {
        title
        actors {
            name
        }
    }
}
```

Will normally generate the following Cypher for the relationship:

```cypher
MATCH (this:Movie)-[this0:`ACTED IN`]->(this1:Actor)
```

The label `ACTED IN` is escaped by placing it inside backticks (`\``), as some characters in it are susceptible of code injection.

If the option `disableRelationshipTypeEscaping` is set in `Neo4jGraphQL`, this safety mechanism will be disabled:

```js
new Neo4jGraphQL({
    typeDefs,
    features: {
        unsafeEscapeOptions: {
            disableRelationshipTypeEscaping: true,
        },
    },
});
```

Generating the following (incorrect) Cypher instead:

```cypher
MATCH (this:Movie)-[this0:ACTED IN]->(this1:Actor)
```

This can be useful in very custom scenarios where the Cypher needs to be tweaked or if the labels and types have already been escaped.

> Warning: This is a safety mechanism to avoid Cypher injection. Changing these options may lead to code injection and an unsafe server.
