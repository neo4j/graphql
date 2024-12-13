---
"@neo4j/graphql": patch
---

Add generic filters for aggregations:

```graphql
{
    posts(where: { likesAggregate: { node: { rating: { average: { eq: 3.2 } } } } }) {
        title
    }
}
```
