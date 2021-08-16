# @neo4j/graphql-ogm-types

<p align="center">
  <a href="https://badge.fury.io/js/%40neo4j%2Fgraphql-ogm">
    <img alt="npm package" src="https://badge.fury.io/js/%40neo4j%2Fgraphql-ogm-types.svg">
  </a>
  <a href="https://discord.gg/neo4j">
    <img alt="Discord" src="https://img.shields.io/discord/787399249741479977?logo=discord&logoColor=white">
  </a>
  <a href="https://community.neo4j.com/c/drivers-stacks/graphql/33">
    <img alt="Discourse users" src="https://img.shields.io/discourse/users?logo=discourse&server=https%3A%2F%2Fcommunity.neo4j.com">
  </a>
</p>

Typescript generation for [@neo4j/graphql-ogm](https://www.npmjs.com/package/@neo4j/graphql-ogm)

1. [Documentation](https://neo4j.com/docs/graphql-manual/current/ogm/)

## Installation

```
$ npm install @neo4j/graphql-ogm-types
```

## Importing

```ts
import { generate } = from "@neo4j/graphql-ogm-types";
```

## Quick Start

```ts
import { OGM } from "@neo4j/graphql-ogm";
import { generate } from "@neo4j/graphql-ogm-types";
import { MovieModel } from "./ogm-types"; // this file will be auto-generated using 'generate'
import * as neo4j from "neo4j-driver";
import * as path from "path";

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

const Movie = ogm.model<MovieModel>("Movie");

async function main() {
    // Only generate types when you make a schema change
    if (process.env.GENERATE) {
        const outFile = path.join(__dirname, "ogm-types.ts");

        await generate({
            ogm,
            outFile,
        });

        console.log("Types Generated");

        process.exit(1);
    }

    // Get full autocomplete on `Movie`, including where argument properties plus the return value
    const [theMatrix] = await Movie.find({ where: { name: "The Matrix" } });
}

main();
```

## Licence

[Apache 2.0](https://github.com/neo4j/graphql/blob/master/packages/ogm/LICENSE.txt)
