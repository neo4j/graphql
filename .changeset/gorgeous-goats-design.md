---
"@neo4j/graphql": minor
---

Following the changes of moving aggregations inside the connection fields, the aggregations filters are moved to the connection input field.

**Current aggregation filters:**

```graphql
{
    posts(where: { likesConnection: { aggregate: { node: { someInt: { average: { eq: 10 } } } } } }) {
        content
    }
}
```

**Deprecate aggregation filters:**

```graphql
{
    posts(where: { likesAggregate: { node: { someInt: { average: { eq: 10 } } } } }) {
        content
    }
}
```
