---
"@neo4j/graphql": minor
---

Add aggregate fieldd in connection:

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
