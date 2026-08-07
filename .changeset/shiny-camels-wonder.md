---
"@neo4j/graphql": minor
---

Add an optional `maxPhraseLength` argument to the indexes of the `@vector` directive, capping the character length of the `phrase` argument accepted by the generated vector query:

```graphql
type Movie
    @node
    @vector(
        indexes: [
            {
                indexName: "movie_index"
                embeddingProperty: "movieVector"
                queryName: "moviesByPhrase"
                provider: OPEN_AI
                maxPhraseLength: 100
            }
        ]
    ) {
    title: String!
}
```

Queries supplying a longer `phrase` are rejected with a `Neo4jGraphQLError` before any Cypher is generated or any embedding provider call is made, giving server owners a per-index guardrail against unbounded embedding costs. The limit is measured in characters (Unicode code points), must be at least 1, and does not affect the `vector` (list of `Float`) input.
