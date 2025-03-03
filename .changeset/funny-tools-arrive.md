---
"@neo4j/graphql": patch
---

Following the changes of moving aggregations inside the connection fields, 
the previous aggregations filters outside the connection filters are now deprecated.

The flag `aggregationFiltersOutsideConnection` has been added to the excludeDeprecatedFields setting.

```ts
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: { excludeDeprecatedFields: { aggregationFiltersOutsideConnection: true } },
});
```
