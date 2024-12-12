---
"@neo4j/graphql": patch
---

Introduce the flag "aggregationFilters" to remove deprecated aggregation filters:

```js
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: { excludeDeprecatedFields: { aggregationFilters: true } },
});
```
