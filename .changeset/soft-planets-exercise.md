---
"@neo4j/graphql": major
---

The deprecated `options` argument has been removed.

Consider the following type definitions:

```graphql
type Movie {
  title: String!
}
```

The migration is as below:

```graphql
# Old syntax
{
  movies(options: { first: 10, offset: 10, sort: [{ title: ASC }] }) {
    title
  }
}

# New syntax
{
  movies(first: 10, offset: 10, sort: [{ title: ASC }]) {
    title
  }
}
```

The `deprecatedOptionsArgument` of `excludeDeprecatedFields` has been removed as it is now a no-op.
