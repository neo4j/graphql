# @neo4j/graphql

> Work in progress ⚠

## Usage

### Installation

```
$ npm install @neo4j/graphql
```

### Importing

```js
const { makeAugmentedSchema } = require("@neo4j/graphql");
```

### Quick Start

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

### Debug

```js
const neoSchema = makeAugmentedSchema({ typeDefs, debug: true });
// or
const neoSchema = makeAugmentedSchema({
    typeDefs,
    debug: (...args) => console.log(args),
});
```

## Package tests

To make sure the build packages expose the endpoint we expected it to, we run a few tests
on the production package.

```bash
npm run test:package-tests
```

This script will create a npm package, move it into `packages/package-tests` (so it doesn't have
the devDependencies from `@neo4j/graphql` in scope), unpack it and run tests on it in different environments and setups.  
It should cleanup after itself.

NOTE: These tests do **not** run when `lerna run test` is executed, because these are not
tests that needds to be run in development. They should run on PR:s and before releases though.
