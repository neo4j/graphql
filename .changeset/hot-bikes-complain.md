---
"@neo4j/graphql": minor
---

Add count fields in aggregations with support for nodes and edges count:

```graphql
query {
    moviesConnection {
        aggregate {
            count {
                nodes
            }
        }
    }
}
```

```graphql
query {
    movies {
        actorsConnection {
            aggregate {
                count {
                    nodes
                    edges
                }
            }
        }
    }
}
```
