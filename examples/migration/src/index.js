const { ApolloServer } = require("apollo-server");
const { Neo4jGraphQL } = require("@neo4j/graphql");

const driver = require("./driver");
const typeDefs = require("./type-definitions");

const neo4jGraphQL = new Neo4jGraphQL({ typeDefs, driver });

neo4jGraphQL.getSchema().then((schema) => {
  const server = new ApolloServer({
    schema,
    context: ({ req }) => ({ req })
  });
  server.listen().then(({ url }) => {
    console.log(`GraphQL server ready at ${url}`);
  });
});
