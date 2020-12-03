# Tutorial

> This chapter is a tutorial that takes the reader through steps necessary to get started with the neo4j/graphql.


## Shop

In This Section we will guide you through how you could setup the GraphQL api to work with the following data model;

![shop-model](./assets/shop.svg)

> Before starting make sure you have setup a Neo4j Instance. [Neo4j Sandbox](https://neo4j.com/sandbox/) is great to get started quickly.


### Defining Type Definitions

First you need to take the model and represent it using GraphQL schema language;

```graphql
type Product {
    id: ID
    name: String
    photos: [Photo] @relationship(type: "HAS_PHOTO", direction: "OUT")
    sizes: [Size] @relationship(type: "HAS_SIZE", direction: "OUT")
}

type Photo {
    id: ID
    description: String
    color: Color @relationship(type: "HAS_COLOR", direction: "OUT")
}

type Size {
    id: ID
    name: String
}

type Color {
    id: ID
    name: String
}
```

In the Javascript ecosystem you have many ways to define thease `typeDefs` such as;

**GraphQL Tag**

> Great support for in-code syntax highlighting

```js
const gql = require("graphql-tag");

const typeDefs = gql`
    type Product {
        id: ID
        name: String
    }        
`;
```

**.GraphQL Files**
```js
const fs = require("fs");

const typeDefs = fs.readFile("./type-defs.gql", "utf-8");
```

**Strings**
```js
const gql = require("graphql-tag");

const typeDefs = `
    type Product {
        id: ID
        name: String
    }        
`;
```

### Generating Your Schema

Once you have picked the best for you its time to provide tease `typeDefs` into the library's exposed function `makeAugmentedSchema`;

```js
const { makeAugmentedSchema } = require("@neo4j/graphql");

const neoSchema = makeAugmentedSchema({ typeDefs })
```

`makeAugmentedSchema` will parse the provided `typeDefs` and spit out a instance of `NeoSchema`. On the instance the most used property will be `.schema` an instance of `GraphQLSchema`. Using this property we can directly pass it into third party tools such as `ApolloServer`;

### Starting Your Server
This tutorial will use [Apollo Server](https://www.apollographql.com/docs/apollo-server/getting-started/). But you could use any GraphQL compliant, Javascript, offering.

⚠ Do not forget to construct and inject the `neo4j-driver`

```js
const neo4j = require("neo4j-driver");
const { makeAugmentedSchema } = require("@neo4j/graphql");
const { ApolloServer } = require("apollo-server");

const typeDefs = `
    type Product {
        id: ID
        name: String
        photos: [Photo] @relationship(type: "HAS_PHOTO", direction: "OUT")
        sizes: [Size] @relationship(type: "HAS_SIZE", direction: "OUT")
    }

    type Photo {
        id: ID
        description: String
        color: Color @relationship(type: "HAS_COLOR", direction: "OUT")
    }

    type Size {
        id: ID
        name: String
    }

    type Color {
        id: ID
        name: String
    }       
`;

const neoSchema = makeAugmentedSchema({ typeDefs });

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("admin", "password"));

const server = new ApolloServer({
    schema: neoSchema.schema,
    context: { driver },
});

async function main(){
    await server.listen(4000);
    console.log("http://localhost:4000");
}

main()
```

### Navigating To Playground
[Apollo Server](https://www.apollographql.com/docs/apollo-server/getting-started/) comes with a neat playground, to test GraphQL queries. Once you run your server using the example provided in [Starting Your Server](#Starting-your-Server) navigate, in your browser, to http://localhost:4000. You should be greeted with something like;

![GraphQL PlayGround](./assets/playground.jpg)
