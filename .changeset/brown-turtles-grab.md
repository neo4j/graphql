---
"@neo4j/graphql": major
---

Subscriptions are now an opt-in feature which can be enabled by using the `@subscription` directive on either schema or type.

For example, to enable subscriptions for the whole schema (equivalent to before this breaking change):

```graphql
type Movie @node {
    title: String!
}

extend schema @subscription
```

To enable subscriptions just for the `Movie` type:

```graphql
type Movie @node @subscription {
    title: String!
}
```
