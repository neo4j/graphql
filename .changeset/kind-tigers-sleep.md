---
"@neo4j/graphql": major
---

Removed deprecated `_NOT` filters, use the Boolean operator `NOT` instead.

** deprecated syntax **
```graphql
query {
  movies(where: { title_NOT: "The Matrix" }) {
    title
  }
}

```

** recommended syntax **

```graphql
query {
  movies(where: { NOT: { title: "The Matrix" } }) {
    title
  }
}
```

As part of the change, the option: `negationFilters` was removed from the `excludeDeprecatedFields` settings.
