---
"@neo4j/graphql": minor
---

Aggregations filters are moved to the connection input field.

**Current aggregation filters:**

```graphql
{
    posts(where: { likesConnection: { aggregate: { node: { someInt: { average: { eq: 10 } } } } } }) {
        content
    }
}
```

**Deprecated aggregation filters:**

```graphql
{
    posts(where: { likesAggregate: { node: { someInt: { average: { eq: 10 } } } } }) {
        content
    }
}
```
