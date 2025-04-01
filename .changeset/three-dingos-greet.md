---
"@neo4j/graphql": major
---

The `@query` directive used on the schema will now also apply to the generation of queries for interface and union types.

The following type definitions will not produce query fields for the `Production` or `Media` types.

```graphql
interface Production {
    title: String!
}

type Movie implements Production @node {
    title: String!
}

type Series implements Production @node {
    title: String!
}

union Media = Movie | Series

extend schema @query(read: false, aggregate: false)
```
