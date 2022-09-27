# Surface executed cypher

## Problem

In the Neo4j GraphQL Toolbox we want to be able to show the executed cypher and its params for each query.
Maybe other use cases need this option too for logging or other use cases.

## Proposed Solution

Configuration boolean to include the executed cypher and its params in the GraphQL response `extensions`. See in the [GraphQL specs](https://spec.graphql.org/June2018/#sec-Response-Format ).

(The `extensions` can also be used to provide rate limit data, See "GraphQL production ready" book)

### Question

Shall we have the ability to do `dry-run`s? That is not possible right now. This could be useful for performance reasons. Yet we also have the TCK tests and the performance tests for that.

## Alternative solution

Expose a hook/callback which is called on each execution of a query. Similar to a logger component like the [log-level lib](https://www.npmjs.com/package/loglevel).

### Usage Examples

Enable it through the `Neo4jGraphQLConfig`:
```js
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    config: {
        includeCypherInGraphQLResponse: true
    },
});
````

This is how the GraphQL response would look like:
```json
{
    "data": {
        "user": {
            "name": "My name"
        }
    },
    "error": {},  // <- This is where the "error" is located if there is one
    "extensions": {
        "cypher": {
            "query": "CALL {\\nCREATE (this0:Genre)\\nSET this0.name = $this0_name\\nRETURN this0\\n}\\nRETURN [\\nthis0 { .name }] AS data", // <- JSON stringified cypher query
            "params": {
                "this0_name": "TestGenre1",
                "resolvedCallbacks": {}
            }
        }
        "costs": {} // <- just to show for a future use case, append other "extensions"
    }
}
```

Questisons:
- Is JSON stringfy the query the best option we have?
- For (very) large queries, will the payload size be an issue?

## Risks

tbd

### Security consideration

Do we expose any sensitive data this way?
Needs to be on opt-in bases, even in the GraphQL Toolbox!

## Out of Scope

Logging for the Neo4j GraphQL library
