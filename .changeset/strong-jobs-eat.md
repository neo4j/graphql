---
"@neo4j/graphql": major
---

Implicit set operations have been removed. For example:

```graphql
# Old syntax
mutation {
  updateMovies(where: { title_EQ: "Matrix" }, update: { title: "The Matrix" }) {
    movies {
      title
    }
  }
}

# New syntax
mutation {
  updateMovies(where: { title_EQ: "Matrix" }, update: { title_SET: "The Matrix" }) {
    movies {
      title
    }
  }
}
```

The `implicitSet` argument of `excludeDeprecatedFields` has been removed.
