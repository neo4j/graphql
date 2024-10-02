---
"@neo4j/graphql": major
---

Remove nested operations as update arguments:

-   create
-   delete
-   connect
-   disconnect
-   connectOrCreate

For example, for create:

_deprecated_

```graphql
mutation UpdatePeople {
    updatePeople(create: { movies: { node: { title: "The Good" } } }) {
        people {
            name
        }
    }
}
```
