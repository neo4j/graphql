---
"@neo4j/graphql": minor
---

Add the ability to specify transaction configuration. e.g. timeout

```js
const transactionConfig = {
    timeout: 60 * 1000,
    metadata: {
        "my-very-own-metadata": "is very good!"
    }
};

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

const server = new ApolloServer({
    schema: await neoSchema.getSchema(),
});

await startStandaloneServer(server, {
    context: async ({ req }) => ({ req, transaction: transactionConfig }),
});
```