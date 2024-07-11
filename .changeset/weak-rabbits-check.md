---
"@neo4j/graphql": minor
---

Add `@vector` directive.

The directive enables two forms of user input, depending on the index configuration: vector input which in GraphQL is a `[Float!]`, and phrase input which is a `String`.

For example to use the `@vector` directive with a vector index, you would define a type like this:

```graphql
type Movie
    @vector(
        indexes: [{ indexName: "myVectorIndexName", propertyName: "embedding", queryName: "searchForRelatedMovies" }]
    ) {
    title: String!
}
```

To configure a provider to use the GenAI plugin and have phrase input, you would define a type like this:

```graphql
type Movie
    @vector(
        indexes: [
            {
                indexName: "myVectorIndexName"
                propertyName: "embedding"
                queryName: "searchForRelatedMovies"
                provider: OPEN_AI
            }
        ]
    ) {
    title: String!
}
```

The constructor of the `Neo4jGraphQL` class would need to be updated to include the `OpenAI` provider under the `vector` feature like this:

```javascript
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    features: {
        vector: {
            OpenAI: {
                token: "my-open-ai-token",
                model: "text-embedding-3-small",
            },
        },
    },
});
```
