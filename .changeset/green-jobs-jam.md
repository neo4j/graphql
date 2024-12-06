---
"@neo4j/graphql": minor
---

Add suport for generic update operators:

```graphql
mutation {
    updateMovies(update: { name: { set: "The Matrix" } }) {
        movies {
            id
            name
        }
    }
}
```
