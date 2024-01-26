# @neo4j/graphql-ogm

<p align="center">
  <a href="https://badge.fury.io/js/%40neo4j%2Fgraphql-ogm">
    <img alt="npm package" src="https://badge.fury.io/js/%40neo4j%2Fgraphql-ogm.svg">
  </a>
  <a href="https://discord.gg/neo4j">
    <img alt="Discord" src="https://img.shields.io/discord/787399249741479977?logo=discord&logoColor=white">
  </a>
  <a href="https://community.neo4j.com/c/drivers-stacks/graphql/33">
    <img alt="Discourse users" src="https://img.shields.io/discourse/users?logo=discourse&server=https%3A%2F%2Fcommunity.neo4j.com">
  </a>
</p>

GraphQL powered OGM for Neo4j and Javascript applications.

1. [Documentation](https://neo4j.com/docs/graphql-manual/current/ogm/)

## Installation

```
npm install @neo4j/graphql-ogm
```

⚠ `graphql` & `neo4j-driver` are **peerDependency**(s)

```
npm install graphql neo4j-driver
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

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("admin", "password"));

const ogm = new OGM({ typeDefs, driver });

async function main() {
    await ogm.init();

    const Movie = ogm.model("Movie");

    const [theMatrix] = await Movie.find({ where: { name: "The Matrix" } });
}
```

## Licence

[Apache 2.0](https://github.com/neo4j/graphql/blob/dev/packages/ogm/LICENSE.txt)
