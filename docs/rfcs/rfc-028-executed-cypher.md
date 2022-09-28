# Surface executed cypher

## Background

The GraphQL Toolbox in its current shape is a great tool for first time users to explore the library features, explore queries, debugging, but once people have gained a better understanding and confidence in using the library they might not need the Toolbox anymore.

By adding a way to surface the cypher translation of their GraphQL queries we can _retain more users_ who might be interested in understanding why some queries are slow, and by giving them additional information we can create a user journey where a developer uses the Toolbox to debug a problem or a slow query, then they reach out to us on Discord by sending a link to the Toolbox. This was we can make the Toolbox part of the developer experience of Neo4j GraphQL community.

## Problem

In the Neo4j GraphQL Toolbox we want to be able to show the executed cypher and its releated params for each query.

## Proposed Solution

Create a configuration boolean in `Neo4jGraphQLConfig` to include the executed cypher query and its params in the GraphQL response `extensions`. See the [GraphQL specs](https://spec.graphql.org/June2018/#sec-Response-Format) for more information regarding the `extensions`.

Side note: the `extensions` can also be used to provide for instance rate limit data, see the [GraphQL production ready](https://book.productionreadygraphql.com/) book.

## Alternative approach

Shall we have the ability to do `dry-run`s? That is not possible at the moment. This could be useful for investigating performance issues. Keep in mind that we also have the TCK tests and the performance tests that cover this topic already.

## Alternative solution

Expose a hook/callback which is called on each execution of a query. Similar to a logger component like the [log-level lib](https://www.npmjs.com/package/loglevel).

The drawback is that linking a GraphQL query execution to a cypher query "callback" can be tricky and potentially be out of sync.

## Usage Example

Enable it through the `Neo4jGraphQLConfig`:
```js
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    config: {
        includeCypherInGraphQLResponse: true  // TODO: better name
    },
});
```

Execute a GraphQL query:
```graphql
query {
    users {
        name
    }
}
```

This is how the GraphQL response would look like when the setting is enabled:
```json
{
    "data": {
        "users": [
            {
                "name": "My name"
            }
        ]
    },
    "error": {},  // <- This is where the "error" would be located if there is one.
    "extensions": {
        "cypher": {
            "query": "CALL {\\nCREATE (this0:Genre)\\nSET this0.name = $this0_name\\nRETURN this0\\n}\\nRETURN [\\nthis0 { .name }] AS data", // <- JSON stringified cypher query
            "params": {
                "this0_name": "TestGenre1",
                "resolvedCallbacks": {}
            }
        }
        "costs": {} // <- just to show for a future/other use case
    }
}
```

#### Documentation

See the comment aboout security considerations below, this needs to be documented.

#### Questions:
- Is JSON stringfy the cypher query the best option we have?
- For (very) large queries, will the payload size be an issue?

## Risks

- Large queries may clog the network

### Security consideration

Do we expose any sensitive data this way? Potentially in the cypher params.

Given the potential risk of exposing sensitive data, this needs to be on opt-in bases including documentation that outlines this potential risk with a configuration setting! That is also valid for the Neo4j GraphQL Toolbox!

## Out of Scope

- Logging for the Neo4j GraphQL library
