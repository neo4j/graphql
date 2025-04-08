---
"@neo4j/graphql": major
---

Fails schema validation if an union is composed of a type with `@node` but not all other types. For example, the following is invalid:

```graphql
union Person = Director | Actor

type Director {
    name: String
}

type Actor @node {
    name: String
}
```
