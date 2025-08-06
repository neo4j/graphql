---
"@neo4j/graphql": patch
---

Improved performance for Connection queries for cases when only `totalCount` is requested.

```graphql
query {
    moviesConnection(where: { title: { eq: "Forrest Gump" } }) {
        totalCount
    }
}
```
