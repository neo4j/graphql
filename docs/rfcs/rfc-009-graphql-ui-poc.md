# GraphQL Graph App PoC

## Problem

The [GraphQL Architect](https://grandstack.io/docs/graphql-architect-overview/#:~:text=GraphQL%20Architect%20is%20a%20graph,Neo4j%20Desktop%20Graph%20Apps%20Gallery) for usage in the Neo4j Desktop is due to be replaced. As an initial step a proof of concept of a successor shall be established.

## Proposed Solution

_Name suggestions:_
(Already taken: Studio, Playground, GraphiQL)
Explorer
Architect
Editor

### User audience

The `@neo4j/graphql` lib's user audience are full stack developers who want a GraphQL API quickly without worrying about the database. This UI can further include developers wanting to experiment in general as well as experiment with/edit the introspected schema.

### Workflow (Graph App)

1. Login page - Specify the database credentials (connectURL, username, password)
2. Schema Editor page
    1. "Bring your own" typeDefs or introspect that database
    2. Show the generated schema if introspected
3. Build Neo4j GraphQL schema
4. Query Editor page
    1. Write queries
    2. Execute queries
    3. Show results
5. _Logout -_ Repeat

### Input

Login:

1. Input fields for username, password, connectURL for dbms

Schema editor
(An open-source editor shall be utlized)

1. Introspect part
2. "Bring your own" typeDefs part
3. _Nice to have_: Store latest typeDefs in window [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

Query editor:
(An open-source editor shall be utlized where applicable)

1. Query input
2. Query parameters
3. Query response
4. Autocomplete for queries and mutations - [monaco-graphql editor](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql)
5. _Nice to have_: Store latest queries&params in window [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
6. _Nice to have_: Docs (utilize from [GraphQL Playground](https://github.com/graphql/graphql-playground)?)
7. _Nice to have_: Tabs for query input and parameters (similar to Apollo Studio)

Keybindings

1. CTRL+ENTER - to run the query
2. CTRL+SHIFT+P - Prettify code
3. ... Other basic ones

### Structure

New packages in `@neo4j/graphql` monorepo:

1. Schema Editor
2. Query Editor
3. Graph App (Neo4j GraphQL UI) - Must Have
4. Server - Nice to have

## Risks

A polished UI can eat up too much time.
Implementing a custom autocomplete functionality for the query editor.
Docs generation and presentation could be a rabbit hole.

Expose/build our own "Apollo Server" library that uses this UI:

```tsx
import { Neo4jGraphQL }
import { Neo4jGraphQLServer }

const neoSchema = new Neo4jGraphQL();

const server = new Neo4jGraphQLServer(neoSchema);

await server.listen(4000);
// http://localhost:4000/playground
```

### Security consideration

This PoC leverage the `@neo4j/graphql` and does not alter any of its behaviours. If the credentials in the login page need to be stored then they are encrypted.

## Out of Scope

Use components of the Neo4j Design System
Write a schema builder
Settings (connection setttings, env vars, etc.)
Query history
