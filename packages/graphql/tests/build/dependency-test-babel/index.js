import { makeAugmentedSchema } from "@neo4j/graphql";

// Augment schema with simple typeDefs input
const typeDefs = `type Movie{ id: ID!}`;
const neoSchema = makeAugmentedSchema({ typeDefs });

// A "Movies" query should have been generated
const generatedTypeDefsMatch = /Movies/;

// If not, throw to exit process with 1 and include stack trace
if (!generatedTypeDefsMatch.test(neoSchema.typeDefs)) {
    throw new Error(`${generatedTypeDefsMatch} was not found in generated typeDefs`);
}
