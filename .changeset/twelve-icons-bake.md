---
"@neo4j/graphql": major
---

Fails schema validation if an interface is implemented by a type with `@node` but not all implemented types use `@node`. For example, the following is invalid:

```graphql
interface Person {
    name: String
}

type Director implements Person {
    name: String
}

type Actor implements Person @node {
    name: String
}
```
