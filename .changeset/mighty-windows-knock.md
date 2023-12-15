---
"@neo4j/graphql": patch
---

Add support for typename_IN filters for interfaces under the experimental flag:

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
    shows(where: { typename_IN: [Series] }) {
        title
    }
}
```
