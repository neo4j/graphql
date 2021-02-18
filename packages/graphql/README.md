# @neo4j/graphql

> Alpha 🏗

A GraphQL to Cypher query execution layer for Neo4j and JavaScript GraphQL implementations.

1. [Introduction](https://github.com/neo4j/graphql-tracker-temp/blob/master/introduction.adoc)
2. [Reference](https://github.com/neo4j/graphql-tracker-temp/blob/master/reference.adoc)
3. [Contributing](https://github.com/neo4j/graphql-tracker-temp/blob/master/contributing.adoc)

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
import { Neo4jGraphQL } from "@neo4j/graphql";
import * as neo4j from "neo4j-driver";
import { ApolloServer } from "apollo-server";
```

Or `require`:

```js
const { Neo4jGraphQL } = require("@neo4j/graphql");
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

const neoSchema = new Neo4jGraphQL({ typeDefs });

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
        movies {
            title
        }
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
        movies {
            title
        }
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
        movies {
            title
        }
    }
}
```

### Find Movies with Genres

```graphql
query {
    movies {
        title
        genres {
            name
        }
    }
}
```

## OGM

Use the GraphQL schema language to power an OGM layer.

```js
import { OGM } from "@neo4j/graphql";
import * as neo4j from "neo4j/driver";

const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic("admin", "password")
);

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

const ogm = new OGM({ typeDefs, driver });

const Movie = ogm.model("Movie");

await Movie.create({
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
});
```

## Auth

Define, nested & related, authorization rules such as; “grant update access to all moderators of a post”;

```graphql
type User {
    id: ID!
    username: String!
}

type Post {
    id: ID!
    title: String!
    moderator: User @relationship(type: "MODERATES_POST", direction: "IN")
}

extend type Post
    @auth(
        rules: [
            {
                allow: [{ moderator: { id: "$jwt.sub" } }]
                operations: ["update"]
            }
        ]
    )
```

Specify rules on fields;

```graphql
type User {
    id: ID!
    username: String!
}

extend type User {
    password: String!
        @auth(
            rules: [
                {
                    OR: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }]
                    operations: "*"
                }
            ]
        )
}
```

Use RBAC;

```graphql
type CatalogItem @auth(rules: [{ operations: "read", roles: "read:catalog" }]) {
    id: ID
    title: String
}

type Customer @auth(rules: [{ operations: "read", roles: "read:customer" }]) {
    id: ID
    name: String
    password: String @auth(rules: [{ operations: "read", roles: "admin" }])
}

type Invoice @auth(rules: [{ operations: "read", roles: "read:invoice" }]) {
    id: ID
    csv: String
    total: Int
}
```
