# Introspect schema from an existing Neo4j database

This is a tool that enables you, with very little effort, to introspect the schema / data model in an existing Neo4j database and builds up a set of data structures that can be transformed into any output format.

This is provided by a separate npm package, `@neo4j/introspector`.

The currently officially supported output format is GraphQL type definitions.
This is usually a one-time-thing and should be considered a starting point for a GraphQL schema.

## GraphQL Type Definitions format

### Features

This tool has full support for generating type definitions, including:

-   `@relationship` directive, including relationship properties
-   `@node`
    -   `label` for mapping where a node label might use a character that's not in the GraphQL supported character set
    -   `additionalLabels` for nodes that has multiple labels
-   Generating a read-only version of the GraphQL type definitions, i.e. generate a `@exclude(operations: [CREATE, DELETE, UPDATE])` directive on all node types.

### Limitations

If an element property has mixed types through out your graph, that property will be excluded from the
generated type definitions. The reason for this is that your GraphQL server will throw an error if it
finds data that doesn't match the specified type.

### Usage examples

Currently there's a programmatic API for introspecting the Neo4j schema and generating GraphQL type definitions.

#### Introspect and persist to file

This example introspects the schema, generates GraphQL type definitions and persists them to a file `schema.graphql`.

You can then serve this file with your GraphQL server.

```js
const { toGraphQLTypeDefs } = require("@neo4j/introspector");
const neo4j = require("neo4j-driver");
const fs = require("fs");

const driver = neo4j.driver("neo4j://localhost:7687", neo4j.auth.basic("neo4j", "password"));

const sessionFactory = () => driver.session({ defaultAccessMode: neo4j.session.READ });

// We create a async function here until "top level await" has landed
// so we can use async/await
async function main() {
    const typeDefs = await toGraphQLTypeDefs(sessionFactory);
    fs.writeFileSync("schema.graphql", typeDefs);
    await driver.close();
}
main();
```

#### Introspect and spin up a read-only schema

This example generates a **read-only** version of the schema from the database and immediately spins up an Apollo server.

Here the type definitions are never persisted to disk.

```js
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { toGraphQLTypeDefs } = require("@neo4j/introspector");
const neo4j = require("neo4j-driver");

const driver = neo4j.driver("neo4j://localhost:7687", neo4j.auth.basic("neo4j", "password"));

const sessionFactory = () => driver.session({ defaultAccessMode: neo4j.session.READ });

// We create a async function here until "top level await" has landed
// so we can use async/await
async function main() {
    const readonly = true; // We don't want to expose mutations in this case
    const typeDefs = await toGraphQLTypeDefs(sessionFactory, readonly);

    const neo4jgraphql = new Neo4jGraphQL({ typeDefs, driver });

    const server = new ApolloServer({
        schema: neo4jgraphql.schema,
        context: ({ req }) => ({ req }),
    });
}
main();
```

## Generic format

You can introspect the schema and then transform it to any desired format.

Example:

```js
const { toGenericStruct } = require("@neo4j/introspector");
const neo4j = require("neo4j-driver");

const driver = neo4j.driver("neo4j://localhost:7687", neo4j.auth.basic("neo4j", "password"));

const sessionFactory = () => driver.session({ defaultAccessMode: neo4j.session.READ });

async function main() {
    const genericStruct = await toGenericStruct(sessionFactory, readonly);
    // Programatically transform to what you need.
}

main();
```
