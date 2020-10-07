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
        genres: [Genre] @relation(name: "IN_GENRE", direction: "OUT")
    }

    type Genre {
        name: String
        movies: [Movie] @relation(name: "IN_GENRE", direction: "IN")
    }
`;

const neoSchema = makeAugmentedSchema({ typeDefs });

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'letmein')
);

const server = new ApolloServer({ 
    schema: neoSchema.schema,
    context: { driver } 
});
```

