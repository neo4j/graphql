# @neo4j/graphql

> Alpha 🏗

A GraphQL to Cypher query execution layer for Neo4j and JavaScript GraphQL implementations.

1. [Introduction](https://github.com/neo4j/graphql-tracker-temp/blob/master/introduction.md)
2. [Reference](https://github.com/neo4j/graphql-tracker-temp/blob/master/reference.md)
3. [Contributing](https://github.com/neo4j/graphql-tracker-temp/blob/master/contributing.md)

## Installation

```
$ npm install @neo4j/graphql
```

⚠ `graphql` is a **peerDependency**

```
$ npm install graphql
```

## Quick Start

Import libraries using either `import`:

```js
import { makeAugmentedSchema } from "@neo4j/graphql";
import * as neo4j from "neo4j-driver";
import { ApolloServer } from "apollo-server";
```

Or `require`:

```js
const { makeAugmentedSchema } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");
const { ApolloServer } = require("apollo-server");
```

Then proceed to create schema objects and serve over port 4000 using Apollo Server:

```js
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
    context: ({ req }) => ({ req, driver }),
});

server.listen(4000).then(() => console.log("Online"));
```

## Example Queries

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

### Create Movie and connect Genre

```graphql
mutation {
    createMovies(
        input: [
            {
                title: "The Matrix"
                year: 1999
                imdbRating: 8.7
                genres: {
                    connect: { where: [{ name: "Sci-fi" }, { name: "Action" }] }
                }
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

## Complex Auth

Define complex, nested & related, authorization rules such as; “grant update access to all moderators of a post”;

```graphql
type User {
    id: ID!
    username: String!
}

type Post
    @auth(
        rules: [
            {
                allow: [{ moderator: { id: "sub" } }] # "sub" being "req.jwt.sub"
                operations: ["update"]
            }
        ]
    ) {
    id: ID!
    title: String!
    moderator: User @relationship(type: "MODERATES_POST", direction: "IN")
}
```
