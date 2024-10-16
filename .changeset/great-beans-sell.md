---
"@neo4j/graphql": major
---

Removes support for non-cdc subscriptions. This means the only available engine for subscriptions is `Neo4jGraphQLSubscriptionsCDCEngine`:

```ts
new Neo4jGraphQL({
    typeDefs,
    driver,
    features: {
        subscriptions: new Neo4jGraphQLSubscriptionsCDCEngine({
            driver,
        }),
    },
});
```

The default behaviour of subscriptions has also been updated to use CDC, so now passing `true` will use the CDC engine with the default parameters and driver:

```ts
new Neo4jGraphQL({
    typeDefs,
    driver,
    features: {
        subscriptions: true,
    },
});
```
