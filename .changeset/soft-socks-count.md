---
"@neo4j/graphql": patch
---

Add `addVersionPrefix` to `cypherQueryOptions` in context to add a Cypher version with `CYPHER` before each query:

```js
{
    cypherQueryOptions: {
        addVersionPrefix: true,
    },
}
```

This prepends all Cypher queries with a `CYPHER [version]` statement:

```cypher
CYPHER 5
MATCH (this:Movie)
WHERE this.title = $param0
RETURN this { .title } AS this
```
