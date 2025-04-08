---
"@neo4j/graphql": major
---

Implicit filtering fields have been removed, please use the explicit versions:

```graphql
# Old syntax
{
  movies(where: { title: "The Matrix" }) {
    title
  }
}

# New syntax
{
  movies(where: { title_EQ: "The Matrix" }) {
    title
  }
}
```

The `implicitEqualFilters` option of `excludeDeprecatedFields` has been removed.
