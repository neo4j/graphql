---
"@neo4j/graphql": patch
---

Optimize connection queries without `totalCount` or `pageInfo` such as:

```graphql
query {
    moviesConnection(first: 20, sort: [{ title: ASC }]) {
        edges {
            node {
                title
            }
        }
    }
}
```

Will no longer calculate `totalCount` in the generated Cypher
