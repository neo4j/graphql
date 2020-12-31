# Introduction

> This chapter is an introduction to the Neo4j GraphQL mapping library (@neo4j/graphql). It also outlines requirements and where to get support.

If you are already familiar with @neo4j/graphql, feel free to jump directly to the [reference](./reference.md) section.

## What's the difference from `neo4j-graphql-js` ?

> Checkout the original Neo4j GraphQL implementation [here](https://grandstack.io/)

When using the new library you will feel right at home, we have taken familiar fundamentals and concepts from neo4j-graphql-js and extended them. This library @neo4j/graphql is a fully supported Neo4j product. Here we look at the changes in the two implementations and also suggest some ways to migrate over to the new library.

### New Features

The latest and greatest stuff exclusive to this new implementation.

#### Nested Mutations

Use nested mutations to perform operations such as; create a post and connect it to an author, with just one GraphQL call leads to ultimately one database trip;

```graphql
mutation {
    createPosts(
        input: [
            {
                title: "nested mutations are cool"
                author: {
                    connect: { where: { name: "dan" } }
                    blog: { connect: { where: { name: "dans blog" } } }
                }
            }
        ]
    ) {
        id
    }
}
```

#### @auth

Define complex, nested & related, authorization rules such as; “grant update access to all moderators of a post”.

```graphql
type User {
  id: ID!
  username: String!
}

type Post @auth(rules: [
  {
    allow: [{ "moderator.id": "sub"}], # "sub" being "req.jwt.sub"
    operations: ["update"]
  }
]) {
  id: ID!
  title: String!
  moderator: User @relationship(type: "MODERATES_POST", direction: "IN")
}
```

Read more about auth in the reference section [here](./reference#auth).

#### OGM

We created an OGM(Object Graph Model) on top of the pre-existing GraphQL work and abstractions. Generate your normal GraphQL schema & use the exposed .model method to receive an instance of a model.

```js
const typeDefs = `
   type Genre {
      id: String
   }

   type Movie {
      id: String
      name: String
      genres: [Genre] @relationship(type: "HAS_GENRE", direction: "OUT")
    }
`;

const driver = neo4j.driver(
    "bolt://localhost:7687",
    neo4j.auth.basic("admin", "password")
);

const neoSchema = makeAugmentedSchema({
    typeDefs,
    context: { driver },
});

const Movie = neoSchema.model("Movie"); // Hi I am your model

await Movie.find({ where: { id: "123" } });
// Nested Mutations
await Movie.create({
    input: [
        {
            title: "Saw",
            genres: { create: [{ name: "Horror" }] },
        },
    ],
});
```

Read more about auth in the reference section [here](./reference#ogm).

## Requirements

@neo4j/graphql 0.0.x at minimum, requires:

-   [Neo4j](https://neo4j.com/) Database 4.1.0 and above.

-   [Apoc](https://neo4j.com/labs/apoc/) 4.1.0 and above

## Additional Resources

### Project Metadata

-   Version Control - https://github.com/neo4j/graphql
-   Bug Tracker - https://github.com/neo4j/graphql/issues

## What is neo4j/graphql ?

GraphQL to Cypher query execution layer for Neo4j and JavaScript GraphQL implementations. This library makes it easier to use Neo4j and GraphQL together. Translating GraphQL queries into a single Cypher query means users do not need to understand the Cypher Query language & can let the library handle all the database talking.

Using this library users can focus on building great applications while just writing minimal backend code.

### Goals of @neo4j/graphql

-   Provide an abstraction for GraphQL developers ontop of Neo4j.

-   Enable the integration with common community library's and tools.
