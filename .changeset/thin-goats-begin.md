---
"@neo4j/graphql": patch
---

Deprecated old aggregate operations:

```graphql
query {
    moviesAggregate {
        count
        rating {
            min
        }
    }
}
```

These fields can be completely removed from the schema with the new flag `deprecatedAggregateOperations`:

```js
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: { excludeDeprecatedFields: { deprecatedAggregateOperations: true } },
});
```
