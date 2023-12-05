---
"@neo4j/graphql": patch
---

Add support for logical operators on filters for interfaces under the experimental flag:

```
interface Show {
    title: String!
}

type Movie implements Show {
    title: String!
}

type Series implements Show {
    title: String!
}

```

```
query actedInWhere {
    shows(where: { OR: [{ title: "Show 1" }, { title: "Show 2" }] }) {
        title
    }
}
```
