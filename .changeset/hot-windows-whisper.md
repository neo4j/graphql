---
"@neo4j/graphql": minor
---

Add aggregate field in connection:

```graphql
query {
    moviesConnection {
        aggregate {
            node {
                count
                int {
                    longest
                }
            }
        }
    }
}
```
