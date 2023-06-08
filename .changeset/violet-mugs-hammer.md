---
"@neo4j/graphql": minor
---

Add @selectable directive, allowing to disable fields from query, aggregations and subscription responses

For example:

```graphql
type Movie {
  title: String!
  description: String @selectable(onRead: true, onAggregate: false)
}
```
