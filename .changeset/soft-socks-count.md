---
"@neo4j/graphql": patch
---

Add feature flag "addCypherVersion":

```js
neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: {
        addCypherVersion: true,
    },
});
```

This prepends all Cypher queries with a `CYPHER [version]` statement:

```cypher
CYPHER 5
MATCH (this:Movie)
WHERE this.title = $param0
RETURN this { .title } AS this
```
