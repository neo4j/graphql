# @neo4j/graphql

> Pre-Alpha 🏗

A GraphQL to Cypher query execution layer for Neo4j and JavaScript GraphQL implementations.


1. [Introduction](https://github.com/neo4j/graphql/blob/master/packages/graphql/docs/introduction.md) — Introducing graph database concepts, Neo4j and GraphQL mapping.
2. [Tutorial](https://github.com/neo4j/graphql/blob/master/packages/graphql/docs/tutorial.md) — Follow along as you get started using neo4j/graphql.
3. [Reference](https://github.com/neo4j/graphql/blob/master/packages/graphql/docs/reference.md) — Reference documentation for neo4j/graphql.
4. [Contributing](https://github.com/neo4j/graphql/blob/master/packages/graphql/CONTRIBUTING.md) - We ❤ all contributor's but please checkout the guide first. 

## Quick Start
### Installation

```
$ npm install @neo4j/graphql
```

⚠ `graphql` is a **peerDependency** 

```
$ npm install graphql
```

### Usage

```js
const { makeAugmentedSchema } = require("@neo4j/graphql");
const { v1: neo4j } = require("neo4j-driver");

const typeDefs = `
    type Movie {
        title: String
        year: Int
        imdbRating: Float
        genres: [Genre] @relationship(type: "IN_GENRE", direction: "OUT")
    }

    type Genre {
        name: String
        movies: [Movie] @relationship(type: "IN_GENRE", direction: "IN")
    }
`;

const neoSchema = makeAugmentedSchema({ typeDefs, debug: true });

const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic("neo4j", "letmein")
);

const server = new ApolloServer({
    schema: neoSchema.schema,
    context: { driver },
});
```