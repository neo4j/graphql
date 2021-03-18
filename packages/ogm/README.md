# @neo4j/graphql-ogm

[![npm version](https://badge.fury.io/js/%40neo4j%2Fgraphql.svg)](https://badge.fury.io/js/%40neo4j%2Fgraphql)

GraphQL powerd OGM for Neo4j and Javascript applications.

## Getting Started

### Installation

```
$ npm install @neo4j/graphql-ogm
```

### Quick Start

```js
import { OGM } from "@neo4j/graphql-ogm";
import * as neo4j from "neo4j-driver";

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

### Documentation

[Here](./docs/index.adoc)
