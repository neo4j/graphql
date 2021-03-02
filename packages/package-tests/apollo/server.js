// eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-unresolved
const { ApolloServer } = require("apollo-server");
// eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-unresolved
const { Neo4jGraphQL } = require("@neo4j/graphql");

const defaultTypeDefs = `
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

async function start(typeDefs = defaultTypeDefs, driver = {}) {
    const neoSchema = new Neo4jGraphQL({ typeDefs });
    const server = new ApolloServer({
        schema: neoSchema.schema,
        context: ({ req }) => ({ driver, req }),
    });
    const { url } = await server.listen();
    console.log(`🚀  Server ready at ${url}`);
}

function stop() {
    process.exit(0);
}

module.exports = { start, stop };
