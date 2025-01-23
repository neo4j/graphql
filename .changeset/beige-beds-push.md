---
"@neo4j/graphql": patch
---

Aggregations on ID fields are now deprecated.
As part of the change, the flag `idAggregations` has been added to the `excludeDeprecatedFields` setting.

```js
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: { excludeDeprecatedFields: { idAggregations: true } },
});
```
