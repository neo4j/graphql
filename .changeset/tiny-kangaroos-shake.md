---
"@neo4j/graphql": patch
---

Fix schema error when defining matrix values as arguments on custom fields #5142.

For example:

```graphql
type Query {
    test(fields: [[String!]]!): String!
}
```
