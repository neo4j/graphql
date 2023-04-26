---
"@neo4j/graphql": major
"@neo4j/graphql-plugin-subscriptions-amqp": patch
---

Change subscriptions setup, this requires changes to constructor options passed to Neo4jGraphQL. See https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#subscriptions-options

For single instance subscriptions use `true`:

```javascript
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: {
        subscriptions: true,
    },
});
```

For any other plugin, pass it `features.subscriptions`:

```javascript
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: {
        subscriptions: subscriptionPlugin,
    },
});
```
