# @neo4j/graphql-ogm

[![npm version](https://badge.fury.io/js/%40neo4j%2Fgraphql-ogm.svg)](https://badge.fury.io/js/%40neo4j%2Fgraphql-ogm)

GraphQL powered OGM for Neo4j and Javascript applications.

1. [Documentation](https://neo4j.com/docs/graphql-manual/current/)

## Installation

```
$ npm install @neo4j/graphql-ogm
```

⚠ `graphql` & `neo4j-driver` are **peerDependency**(s)

```
$ npm install graphql neo4j-driver
```

## Importing

Our TypeScript source is transpiled into Common JS, this means you can use the `require` syntax;

```js
const { OGM, Model } = require("@neo4j/graphql-ogm");
```

### Quick Start

```js
const { OGM } = require("@neo4j/graphql-ogm");
const neo4j = require("neo4j-driver");

const typeDefs = `
    type Movie {
        id: ID
        name: String
    }
`;

const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic("admin", "password")
);

const ogm = new OGM({ typeDefs, driver });

const Movie = ogm.model("Movie");

const [theMatrix] = await Movie.find({ where: { name: "The Matrix" } });
```
