const { ApolloServer } = require("apollo-server");
const { makeAugmentedSchema } = require("neo4j-graphql-js");

const driver = require("./driver");
const typeDefs = require("./type-definitions");

const schema = makeAugmentedSchema({ typeDefs });

const server = new ApolloServer({ schema, context: { driver } });

server.listen().then(({ url }) => {
    console.log(`neo4j-graphql-js API ready at ${url}`);
});
