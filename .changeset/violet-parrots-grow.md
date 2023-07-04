---
"@neo4j/graphql": minor
"@neo4j/graphql-ogm": minor
---

This release includes the addition of three new directives for authentication and authorization:

The `@authentication` directive is used to configure authentication checks at either the schema, object or field level:

```graphql
type Post @authentication(operations: [CREATE]) {
    content: String!
}
```

The `@authorization` directive is used to configure fine-grained authorization against node properties:

```graphql
type User @authorization(validate: [{ where: { node: { id: "$jwt.sub" } } }]) {
    id: ID!
}
```

The `@subscriptionsAuthorization` directive is used to configure fine-grained authorization specifically for Subscriptions events:

```graphql
type Post @subscriptionsAuthorization(filter: [{ where: { node: { author: "$jwt.sub" } } }]) {
    likes: Int!
    author: ID!
}
```

These three directives supersede the `@auth` directive, which will be removed in version 4.0.0 of the Neo4j GraphQL Library.
