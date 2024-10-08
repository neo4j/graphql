---
"@neo4j/graphql": minor
---

Remove connection wrapper on vector queries

_Previous:_

```graphql
query MovieVectorQuery($vector: [Float!]!) {
    myVectorQuery(vector: $vector) {
        moviesConnection {
            edges {
                cursor
                score
                node {
                    title
                }
            }
        }
    }
}
```

_Now:_

```graphql
query MovieVectorQuery($vector: [Float!]!) {
    myVectorQuery(vector: $vector) {
        edges {
            cursor
            score
            node {
                title
            }
        }
    }
}
```
