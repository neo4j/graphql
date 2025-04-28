---
"@neo4j/graphql": minor
---

Add support for case insensitive string filters. These can be enabled with the option `CASE_INSENSITIVE` in features:

```javascript
const neoSchema = new Neo4jGraphQL({
    features: {
        filters: {
            String: {
                CASE_INSENSITIVE: true,
            },
        },
    },
});
```

This enables the field `caseInsensitive` on string filters:

```graphql
query {
    movies(where: { title: { caseInsensitive: { eq: "the matrix" } } }) {
        title
    }
}
```

This generates the following Cypher:

```cypher
MATCH (this:Movie)
WHERE toLower(this.title) = toLower($param0)
RETURN this { .title } AS this
```
