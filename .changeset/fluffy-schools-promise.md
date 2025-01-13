---
"@neo4j/graphql": minor
---

Introduced the `typename` filter that superseded the `typename_IN` filter. 
As part of the change, the flag `typename_IN` has been added to the `excludeDeprecatedFields` setting.

```js
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    features: { excludeDeprecatedFields: { typename_IN: true } },
});
```
