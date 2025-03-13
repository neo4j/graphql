---
"@neo4j/graphql": patch
---

Fix edge filtering for aggregate fields inside connections.

Previously, the following query would aggregate all the movies named The Matrix, ignoring the edge filter

```graphql
query {
    actors {
        moviesConnection(where: { edge: { screentime_EQ: 19 }, node: { title_EQ: "The Matrix" } }) {
            aggregate {
                node {
                    title {
                        longest
                    }
                }
            }
        }
    }
}
```
