---
"@neo4j/graphql": Major
---

Changed the generated `sort` argument on the top-level Connection field as a list of non-nullable elements in case the target is an Interface.

From:
```graphql
productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
```
To:
```graphql
productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
```

