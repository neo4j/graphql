---
"@neo4j/graphql": major
---

Fixed incorrect behavior of `single` and `some` filters on relationships to unions.

Given the following union and relationship:

```graphql
union Production = Movie | Series
```

and a relationship to this union:

```graphql
type Actor @node {
    name: String!
    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
}
```

These queries previously returned incorrect results:

```graphql
query {
    actors(
        where: {
            actedIn: { single: { Movie: { title_CONTAINS: "The Office" }, Series: { title_ENDS_WITH: "Office" } } }
        }
    ) {
        name
    }
}
```

```graphql
query {
    actors(
        where: { actedIn: { some: { Movie: { title_CONTAINS: "The Office" }, Series: { title_ENDS_WITH: "Office" } } } }
    ) {
        name
    }
}
```

Previously, conditions inside single and some were evaluated separately for each concrete type in the union, requiring all to match. This was incorrect.

New behavior:

- `single`: Now correctly returns actors with exactly one related node across the whole union, rather than per type.
- `some`: Now correctly returns actors with at least one matching related node of any type in the union.

This fix also applies to the deprecated filters `actedIn_SINGLE` and `actedIn_SOME`.
