---
"@neo4j/graphql": major
---

Fails schema generation if there are conflicting plural names in types. For example, the following schema will fail, due to ambiguous `Techs` plural

```graphql
type Tech @node(plural: "Techs") {
    name: String
}

type Techs {
    value: String
}
```
