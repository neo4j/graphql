/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable new-cap */
import { ApolloServer } from "apollo-server";
import { driver, auth } from "neo4j-driver";
import makeAugmentedSchema from "../../src/api/make-augmented-schema";

const typeDefs = `
    type Actor {
        name: String
        movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
    }
    
    type Person {
        name: String
        movie: Movie @cypher(statement: """
        MATCH (m:Movie)
        RETURN m
        """)
    }

    type Movie {
        id: ID
        title: String
        actors: [Actor]! @relationship(type: "ACTED_IN", direction: "IN")
        mainActor: Actor @relationship(type: "MAIN_ACTOR", direction: "OUT")
        people: [Person] @cypher(statement: """
            MATCH (p:Person)
            RETURN p
        """)
    }
`;

const schema = makeAugmentedSchema({
    typeDefs,
});

const { NEO4J_URI = "neo4j://localhost:7687/neo4j", NEO4J_USER = "admin", NEO4J_PASSWORD = "password" } = process.env;

// @ts-ignore
const d = new driver(NEO4J_URI, auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const server = new ApolloServer({
    context: { driver: d },
    schema: schema.schema,
});

server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});
