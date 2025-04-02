---
"@neo4j/graphql": major
---

Does not generate queries for interfaces without an implementing type with the `@node` directive.

For example. The following type definitions:

```graphql
interface Production {
    title: String!
}

type Movie @node {
    title: String!
}

type NotANode implements Production {
    title: String!
}
```

Will no longer generate the queries and types related to the interface `Production`:

```graphql
type Query {
    productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
    productionsConnection(
        after: String
        first: Int
        sort: [ProductionSort!]
        where: ProductionWhere
    ): ProductionsConnection!
}
```
