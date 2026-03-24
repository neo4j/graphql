/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

// Import using commonJS
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { printSchema } = require("graphql");
// Augment schema with simple typeDefs input
const typeDefs = /* GraphQL */ `
    type Movie @node {
        id: ID!
    }
`;
const neoSchema = new Neo4jGraphQL({ typeDefs });

neoSchema.getSchema().then((schema) => {
    // A "Movies" query should have been generated
    const generatedTypeDefsMatch = /movies/;

    // If not, throw to exit process with 1 and include stack trace
    if (!generatedTypeDefsMatch.test(printSchema(schema))) {
        throw new Error(`${generatedTypeDefsMatch} was not found in generated typeDefs`);
    }
});
