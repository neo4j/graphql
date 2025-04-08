---
"@neo4j/graphql": patch
---

Deprecates old aggregation filters for relationships in favor of more generic filters:

Before:

```js
query Movies {
  movies(
    where: { actorsAggregate: { node: { lastRating_AVERAGE_GT: 6 } } }
  ) {
    title
  }
}
```

Now:

```js
query Movies {
  movies(
    where: {
      actorsAggregate: { node: { lastRating: { average: { gt: 6 } } } }
    }
  ) {
    title
  }
}
```
