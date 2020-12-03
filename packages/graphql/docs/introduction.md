# Introduction

> This chapter is an introduction to the Neo4j GraphQL mapping library (neo4j/graphql). It also outlines requirements and where to get support.

If you are already familiar with Neo4j and neo4j/graphql, feel free to jump directly to the [tutorial](./tutorial.md) or [reference](./reference.md) sections.

## What's the difference from `neo4j-graphql-js` ?

> Checkout the original Neo4j GraphQL implementation [here](https://grandstack.io/)

At a high level, here is what has changed in this **Officially Supported** GraphQL Library:

* Nested Mutations - Create many nodes and relationships with one GraphQL Query.

* GraphQL Schema - We changed the way we generate the Schema. Users can now; use `where` arguments, create many nodes at once and further semantic changes to the schema.  

* Auth Directive Support - Advanced Authentication is supported 'out the box'. 

* Relationship Directive - We changed the `relation` directive to `relationship`.

## Requirements
neo4j/graphql 0.0.x at minimum, requires:

* Neo4j Database 4.1.0 and above.

* [Apoc](https://neo4j.com/labs/apoc/) 4.1.0 and above

## Additional Resources

### Project Metadata
* Version Control - https://github.com/neo4j/graphql
* Bug Tracker - https://github.com/neo4j/graphql/issues

## What is neo4j/graphql ?
neo4j/graphql is a GraphQL to Cypher query execution layer for Neo4j and JavaScript GraphQL implementations. This library makes it easier to use Neo4j and GraphQL together. Translating GraphQL queries into a single Cypher query... means users don't need to understand the Cypher Query language & can let the library handle all the database talking. 

Using this library users can focus on building great applications while just writing minimal backend code along with some `typeDefs`.


### Goals of neo4j/graphql
* Translate GraphQL queries to Cypher to simplify the process of writing GraphQL resolvers

* Work with graphql-tools, graphql-js, and apollo-server

* Expose the power of Cypher through GraphQL via the @cypher directive