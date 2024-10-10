---
"@neo4j/graphql": major
---

Remove deprecated top level arguments for nested operations in mutations:

-   create
-   delete
-   connect
-   disconnect
-   connectOrCreate

For example, the following is no longer valid:

_invalid_

```graphql
mutation UpdatePeople {
    updatePeople(create: { movies: { node: { title: "The Good" } } }) {
        people {
            name
        }
    }
}
```

_valid_

```graphql
mutation UpdatePeople {
    updatePeople(update: { movies: { create: { node: { title: "The Good" } } } }) {
        people {
            name
        }
    }
}
```
