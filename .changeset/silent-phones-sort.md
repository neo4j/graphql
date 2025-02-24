---
"@neo4j/graphql": minor
---

Following the changes of moving aggregations inside the connection fields, the aggregation filter `count` is now supported on both nodes and relationships.

**Count filter on nodes:**

```graphql
{
    posts(where: { likesConnection: { aggregate: { count: { nodes: { eq: 2 } } } } }) {
        title
        likes {
            name
        }
    }
}
```

**Count filter on edges:**

```graphql
{
    posts(where: { likesConnection: { aggregate: { count: { edges: { eq: 2 } } } } }) {
        title
        likes {
            name
        }
    }
}
```
