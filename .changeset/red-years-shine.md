---
"@neo4j/graphql": patch
---

Cypher optimisation on queries with only `totalCount`. For example:

```graphql
query {
    moviesConnection(where: { title: { eq: "Forrest Gump" } }) {
        totalCount
    }
}
```
