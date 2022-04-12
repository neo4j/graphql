# GraphQL Graph App PoC

## Problem

The [GraphQL Architect](https://grandstack.io/docs/graphql-architect-overview/#:~:text=GraphQL%20Architect%20is%20a%20graph,Neo4j%20Desktop%20Graph%20Apps%20Gallery) for usage in the Neo4j Desktop is due to be replaced. As an initial step a proof of concept of a successor shall be established.  
The successor application will be made available to install as Graph App in Neo4j Desktop. If time permits it, would be favorable if we can add the successor to the 'Neo4j Developer Graph Apps Gallery' in Neo4j Desktop.

## Proposed Solution

_Name suggestions:_  
Explorer  
Architect  
Editor  
UI  
Frame  
(Already taken: Studio, Playground, GraphiQL)

### User audience

The `@neo4j/graphql` lib's user audience are full stack developers who want a GraphQL API quickly without worrying about the database.  
This UI can further include developers wanting to experiment in general as well as experiment with/edit the introspected schema.  
The main aim is for prototyping and rapid development for both experinced as well as non-experienced users.


### Workflow (Graph App)

1. Login page
    1. Specify the database credentials (connectURL, username, password)
2. Schema Editor page
    1. "Bring your own" typeDefs or introspect that database
    2. Show the generated schema if introspected
3. Build Neo4j GraphQL schema
4. Query Editor page
    1. Write queries
    2. Execute queries
    3. Show results
5. Logout - _Repeat_

#### Metrics

We want to track valuable events/actions of the UI to get an understanding and data of the usage (pattern) from the get go. This could include button clicks such as "generate typeDefs" or related things.  
A spreasheet is to create to write down all the tracking events, their name, why we track it etc.  
It is suggested to use [Segment](https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/) as it is used by other products at Neo4j. 

_Nice to have_: As a one-off, measure the time it takes to get started with the `@neo4j/graphql` library using the node (`index.ts`) script versus this successor application.


### Input

Login:

1. Input fields for username, password, connectURL for dbms
2. _Nice to have_: Store credentials (encrypted!) in window [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

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
5. _Nice to have_: [Explorer plugin](https://user-images.githubusercontent.com/476818/51567716-c00dfa00-1e4c-11e9-88f7-6d78b244d534.gif) (or similar) for/from GraphiQL. [Repo](https://github.com/OneGraph/graphiql-explorer)
6. _Nice to have_: Store latest queries&params in window [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
7. _Nice to have_: Docs (utilize from [GraphQL Playground](https://github.com/graphql/graphql-playground)?)
8. _Nice to have_: Tabs for query input and parameters (similar to Apollo Studio)

Keybindings

1. CTRL+ENTER - to run the query
2. CTRL+SHIFT+P - to prettify the code
3. _Nice to have_: Other common/basic ones


### Sketch

![GraphQL_UI_v5](https://user-images.githubusercontent.com/8817964/155744938-2ec1b531-3b83-44e1-9fd0-371022150274.png)

[Link](https://excalidraw.com/#json=b4U6WUvi6icFdMQaXoDjo,EjqhTATzUC7GqqiAgFPSjw) to excalidraw drawing.


### Structure

New packages in `@neo4j/graphql` monorepo:

1. _Must have_: Graph App (Neo4j GraphQL UI)
2. Schema Editor
3. Query Editor
4. _Nice to have_: Server


## Documentation

If the resulting application is of sufficient quality (team decision):  
Include this application in the "getting started" (or related) documentation as an alternative to the currently described way.

_Stretch_: Have this application publically available as demo online as part of the offical Neo4j GraphQL webpage: https://neo4j.com/product/graphql-library/ 


## Risks

A polished UI can eat up too much time.  
Implementing a custom autocomplete functionality for the query editor.  

Spending too much time on building our own "Apollo Server" library that uses this UI:

```tsx
import { Neo4jGraphQL }
import { Neo4jGraphQLServer }

const neoSchema = new Neo4jGraphQL();

const server = new Neo4jGraphQLServer(neoSchema);

await server.listen(4000);
// http://localhost:4000/playground
```

### Rabbit holes

Large databases could be slow to introspect, and so we need a way to cache the schema generation.   
Docs generation and presentation.  

### Security consideration

This PoC leverage the `@neo4j/graphql` and does not alter any of its behaviours. If the credentials (login page) need to be stored then they are encrypted.

## Out of Scope

Use components of the Neo4j Design System  
Write a schema builder  
Settings (connection settings, env vars, etc.)  
Query history
