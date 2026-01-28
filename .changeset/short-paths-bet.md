---
"@neo4j/graphql": patch
---

Fix failing query when aggregation and totalCount is queried in a connection, but not edges. For example:

```graphql
type Actor @node {
    name: String!
}
```

```graphql
query {
    actorsConnection {
        totalCount
        aggregate {
            node {
                name {
                    shortest
                }
            }
            count {
                nodes
            }
        }
    }
}
```
