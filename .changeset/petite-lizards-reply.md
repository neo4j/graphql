---
"@neo4j/graphql": minor
---

Add `groupBy` fields in connections for grouping results.

These can be enabled with the `@groupBy` directive:

```graphql
type Movie {
    title: String!
    year: Int! @groupBy
}
```

This enables queries such as:

```graphql
moviesConnection {
    groupBy(fields: {year: true}) {
        edges {
            node {
                title
            }
        }
    }
}
```

Which returns the movies, grouped by `year`
