/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { Neo4jGraphQL } = require("@neo4j/graphql");

const defaultTypeDefs = /* GraphQL */ `
    type Movie @node {
        title: String
        year: Int
        imdbRating: Float
        genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
    }

    type Genre @node {
        name: String
        movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN)
    }
`;

async function start(typeDefs = defaultTypeDefs, driver = {}) {
    const neoSchema = new Neo4jGraphQL({ typeDefs });
    const server = new ApolloServer({ schema: await neoSchema.getSchema(), context: ({ req }) => ({ driver, req }) });
    const { url } = await startStandaloneServer(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
        listen: { port: 4000 },
    });
    console.log(`🚀  Server ready at ${url}`);
}

function stop() {
    process.exit(0);
}

module.exports = { start, stop };
