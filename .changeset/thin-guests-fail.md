---
"@neo4j/graphql": major
---

Throws an error when the same field is updated multiple times on same update operation.

For example:

```graphql
mutation {
    updateMovies(update: { tags_POP: 1, tags_PUSH: "d" }) {
        movies {
            title
            tags
        }
    }
}
```
