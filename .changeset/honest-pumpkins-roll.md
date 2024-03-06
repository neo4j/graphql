---
"@neo4j/graphql": minor
---

Support for top-level connection query on interfaces. For example:

_Typedefs_

```graphql
interface Show {
    title: String!
}

type Movie implements Show {
    title: String!
    cost: Float
}

type Series implements Show {
    title: String!
    episodes: Int
}
```

_Query_

```graphql
query {
    showsConnection(where: { title_CONTAINS: "The Matrix" }) {
        edges {
            node {
                title
                ... on Movie {
                    cost
                }
            }
        }
    }
}
```
