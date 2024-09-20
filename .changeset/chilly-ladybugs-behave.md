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

```
mutation UpdatePeople {
  updatePeople(create: {
    movies: [
      {
        node: {
          title: "The Good",
        },
      },
    ],
  }) {
    people {
      name
    }
  }
}
```

_recommended_

```
mutation UpdatePeople {
  updatePeople(update: {
    movies: {
      create: {
        node: {
          title: "The Good",
        },
      }
    }
  }) {
    people {
      name
    }
  }
}
```
