---
"@neo4j/graphql": patch
---

Allow enabling/disabling of connection query fields on type by type basis as well as for the whole schema via a new `@query` directive argument `connection`. Default value of `connection` is the same as `read`, inheriting its default value of `true` if not provided.

Usage example:

The following type definitions will create the GraphQL Query fields:

```gql
type Actor @query(read: false, connection: true) @node {
    name: String
}
```

```graphql
type Query {
    # only connection field
    actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
}
```

Inheriting the value of the read argument as default:

```gql
type Actor @query(read: false) @node {
    name: String
}
```

```graphql
type Query {
    # no reads
}
```
