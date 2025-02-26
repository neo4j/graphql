---
"@neo4j/graphql": minor
---

The aggregation filter `count` now supports both, nodes and relationships.

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
