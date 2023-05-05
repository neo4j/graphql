"use strict";

// npm install @apollo/server graphql
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { getLargeSchema } from "./typedefs.js";

const typeDefs = `#graphql
    union Likable = Person | Movie

    type Person {
        name: String!
        born: Int!
        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
        directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
        reviewed: [Movie!]! @relationship(type: "REVIEWED", direction: OUT)
        produced: [Movie!]! @relationship(type: "PRODUCED", direction: OUT)
        likes: [Likable!]! @relationship(type: "LIKES", direction: OUT)
    }

    type Movie
        @fulltext(
            indexes: [
                { queryName: "movieTaglineFulltextQuery", name: "MovieTaglineFulltextIndex", fields: ["tagline"] }
            ]
        ) {
        id: ID!
        title: String!
        tagline: String
        released: Int
        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
        directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
        reviewers: [Person!]! @relationship(type: "REVIEWED", direction: IN)
        producers: [Person!]! @relationship(type: "PRODUCED", direction: IN)
        likedBy: [User!]! @relationship(type: "LIKES", direction: IN)
        oneActorName: String @cypher(statement: "MATCH (this)<-[:ACTED_IN]-(a:Person) RETURN a.name")
        favouriteActor: Person @relationship(type: "FAV", direction: OUT)
    }

    type MovieClone {
        title: String!
        favouriteActor: Person! @relationship(type: "FAV", direction: OUT)
    }
    type PersonClone {
        name: String!
        movies: [MovieClone!]! @relationship(type: "FAV", direction: IN)
    }

    type User {
        name: String!
        likes: [Likable!]! @relationship(type: "LIKES", direction: OUT)
    }
`;

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"), {
    maxConnectionPoolSize: 100,
});

const neoSchema = new Neo4jGraphQL({
    typeDefs: typeDefs + getLargeSchema(100),
    driver,
});

const schema = await neoSchema.getSchema();
await neoSchema.assertIndexesAndConstraints({ options: { create: true } });

const server = new ApolloServer({ schema });

const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => ({ token: req.headers.token }),
    listen: { port: 4000 },
});

console.log(`🚀  Server ready at ${url}`);
