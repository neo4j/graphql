---
"@neo4j/graphql": patch
---

Cypher optimized for connections only containing aggregate fields. The following query:

```graphql
{
    moviesConnection {
        aggregate {
            count {
                nodes
            }
        }
    }
}
```

Will generate the new Cypher:

```cypher
CALL {
    MATCH (this:Movie)
    RETURN { nodes: count(DISTINCT this) } AS var0
}
RETURN { aggregate: { count: var0 } } AS this
```

Instead of the less performant previous Cypher:

```cypher
CALL {
    MATCH (this:Movie)
    RETURN { nodes: count(DISTINCT this) } AS var0
}
CALL {
    WITH *
    MATCH (this1:Movie)
    WITH collect({ node: this1 }) AS edges
    WITH edges, size(edges) AS totalCount
    CALL {
        WITH edges
        UNWIND edges AS edge
        WITH edge.node AS this1
        RETURN collect({ node: { __id: id(this1), __resolveType: "Movie" } }) AS var2
    }
    RETURN var2, totalCount
}
RETURN { edges: var2, totalCount: totalCount, aggregate: { count: var0 } } AS this
```
