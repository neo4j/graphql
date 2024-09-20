---
"@neo4j/graphql": patch
---

Deprecates top level arguments for nested operations on updates in favor of traversing the update argument. The deprecated arguments are:

-   create
-   delete
-   connect
-   disconnect
-   connectOrCreate

For example, for create:

_deprecated_

```graphql
mutation UpdatePeople {
    updatePeople(create: { movies: [{ node: { title: "The Good" } }] }) {
        people {
            name
        }
    }
}
```

_recommended_

```graphql
mutation UpdatePeople {
    updatePeople(update: { movies: { create: { node: { title: "The Good" } } } }) {
        people {
            name
        }
    }
}
```

These deprecated arguments can be removed from the schema with the flag `nestedUpdateOperationsFields` in `excludeDeprecatedFields`:

```js
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: {
        excludeDeprecatedFields: {
            nestedUpdateOperationsFields: true,
        },
    },
});
```
