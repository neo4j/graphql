const { ApolloServer } = require("apollo-server");
const { makeAugmentedSchema } = require("@neo4j/graphql");
const neo4j = require("neo4j-driver");

const typeDefs = `
    type Movie {
        title: String
        year: Int
        imdbRating: Float
    }

    type Genre {
        name: String
    }
`;

const neoSchema = makeAugmentedSchema({ typeDefs });

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("admin", "password"));

const server = new ApolloServer({
    schema: neoSchema.schema,
    context: { driver },
});

server.listen().then(({ url }) => {
    console.log(`🚀  Server ready at ${url}`);
});
