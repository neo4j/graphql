# @neo4j/graphql

> Alpha 🏗

A GraphQL to Cypher query execution layer for Neo4j and JavaScript GraphQL implementations.

1. [Introduction](https://github.com/neo4j/graphql/blob/master/packages/graphql/docs/introduction.md)
2. [Reference](https://github.com/neo4j/graphql/blob/master/packages/graphql/docs/reference.md)
3. [Contributing](https://github.com/neo4j/graphql/blob/master/packages/graphql/CONTRIBUTING.md)

> Checkout [neo-push](https://github.com/danstarns/neo-push) for an Example blog site built with @neo4j/graphql & React.js

## Installation

```
$ npm install @neo4j/graphql
```

⚠ `graphql` is a **peerDependency**

```
$ npm install graphql
```

## Usage

### Quick Start

```js
const { makeAugmentedSchema } = require("@neo4j/graphql");
const { v1: neo4j } = require("neo4j-driver");
const { ApolloServer } = require("apollo-server");

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

const neoSchema = makeAugmentedSchema({ typeDefs });

const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic("neo4j", "letmein")
);

const server = new ApolloServer({
    schema: neoSchema.schema,
    context: { driver },
});
```

### Create Movie

```graphql
mutation {
    createMovies(
        input: [{ title: "The Matrix", year: 1999, imdbRating: 8.7 }]
    ) {
        title
    }
}
```

### Connect to Genre

```graphql
mutation {
    updateMovies(
        where: { title: "The Matrix" }
        connect: {
            genres: { where: { OR: [{ name: "Sci-fi" }, { name: "Action" }] } }
        }
    ) {
        title
    }
}
```

### Create Both Movie & Genre at the same time

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "The Matrix"
                year: 1999
                imdbRating: 8.7
                genres: { create: [{ name: "Sci-fi" }, { name: "Action" }] }
            }
        ]
    ) {
        title
    }
}
```

### Find Movies with Genres

```graphql
query {
    Movies {
        title
        genres {
            name
        }
    }
}
```
