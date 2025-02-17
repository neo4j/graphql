---
"@neo4j/graphql": major
---

Sets addVersionPrefix to true by default, this will prepend the Cypher version to all queries by default, ensuring that the correct Cypher version is used in Neo4j:

```cypher
CYPHER 5
MATCH(this:Movie)
```

This may be incompatible with older versions of Neo4j and can be disabled by setting `cypherQueryOption.addVersionPrefix` in the context to false:

```js
{
    cypherQueryOptions: {
        addVersionPrefix: true,
    },
}
```

For example, for an apollo server:

```js
await startStandaloneServer(server, {
    context: async ({ req }) => ({
        req,
        cypherQueryOptions: {
            addVersionPrefix: false,
        },
    }),
    listen: { port: 4000 },
});
```
