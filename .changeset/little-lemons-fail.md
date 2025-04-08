---
"@neo4j/graphql": major
---

Single element relationships have been removed in favor of list relationships:

Before

```graphql
type Movie {
    director: Person @relationship(type: "DIRECTED", direction: "IN")
}
```

After

```graphql
type Movie {
    director: [Person!]! @relationship(type: "DIRECTED", direction: "IN")
}
```

This requires updating filters, clients and auth rules to use the list filter operations.

Single element relationships cannot be reliably enforced, leading to a data inconsistent with the schema. If the GraphQL model requires 1-1 relationships (such as in federations) these can now be achieved with the `@cypher` directive instead:

```graphql
type Movie {
    director: Person
        @cypher(
            statement: """
            MATCH(this)-[:ACTED_IN]->(p:Person)
            RETURN p
            """
            columnName: "p"
        )
}
```
