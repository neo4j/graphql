# @neo4j/graphql

<p align="center">
  <a href="https://badge.fury.io/js/%40neo4j%2Fgraphql">
    <img alt="npm package" src="https://badge.fury.io/js/%40neo4j%2Fgraphql.svg">
  </a>
  <a href="https://discord.gg/neo4j">
    <img alt="Discord" src="https://img.shields.io/discord/787399249741479977?logo=discord&logoColor=white">
  </a>
  <a href="https://community.neo4j.com/c/drivers-stacks/graphql/33">
    <img alt="Discourse users" src="https://img.shields.io/discourse/users?logo=discourse&server=https%3A%2F%2Fcommunity.neo4j.com">
  </a>
</p>

A GraphQL to Cypher query execution layer for Neo4j and JavaScript GraphQL implementations.

1. [Documentation](https://neo4j.com/docs/graphql-manual/current/)

## Installation

```
npm install @neo4j/graphql
```

⚠ `graphql` & `neo4j-driver` are **peerDependency**(s)

```
npm install graphql neo4j-driver
```

## Importing

Our TypeScript source is transpiled into Common JS, this means you can use the `require` syntax;

```js
const { Neo4jGraphQL } = require("@neo4j/graphql");
```

## Quick Start

Create schema and serve over port 4000 using Apollo Server:

```js
const { Neo4jGraphQL } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");
const { ApolloServer } = require("apollo-server");

const typeDefs = `
    type Movie {
        title: String
        year: Int
        imdbRating: Float
        genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
    }

    type Genre {
        name: String
        movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN)
    }
`;

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "letmein"));

const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

async function main() {
    const schema = await neoSchema.getSchema();

    const server = new ApolloServer({
        schema,
        context: ({ req }) => ({ req }),
    });

    await server.listen(4000);

    console.log("Online");
}
```

## Example Queries

### Create Movie

```graphql
mutation {
    createMovies(input: [{ title: "The Matrix", year: 1999, imdbRating: 8.7 }]) {
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
        connect: { genres: { where: { node: { OR: [{ name: "Sci-fi" }, { name: "Action" }] } } } }
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
                genres: { connect: { where: { node: { AND: [{ name: "Sci-fi" }, { name: "Action" }] } } } }
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
    moderator: User @relationship(type: "MODERATES_POST", direction: IN)
}

extend type Post @auth(rules: [{ allow: [{ moderator: { id: "$jwt.sub" } }], operations: [UPDATE] }])
```

Specify rules on fields;

```graphql
type User {
    id: ID!
    username: String!
}

extend type User {
    password: String! @auth(rules: [{ OR: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }] }])
}
```

Use RBAC;

```graphql
type Customer @auth(rules: [{ operations: [READ], roles: ["read:customer"] }]) {
    id: ID
    name: String
    password: String @auth(rules: [{ operations: [READ], roles: ["admin"] }])
}

type Invoice @auth(rules: [{ operations: [READ], roles: ["read:invoice"] }]) {
    id: ID
    csv: String
    total: Int
}
```

## Licence

[Apache 2.0](https://github.com/neo4j/graphql/blob/dev/packages/graphql/LICENSE.txt)
