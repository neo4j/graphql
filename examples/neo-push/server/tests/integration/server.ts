import { ApolloServer } from "apollo-server-express";
import { createTestClient } from "apollo-server-testing";
import { OGM } from "@neo4j/graphql-ogm";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { typeDefs, resolvers } from "../../src/gql";
import { Context } from "../../src/types";

function server(driver, context = {}) {
    const ogm = new OGM({
        typeDefs,
        driver,
    });

    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        resolvers,
        config: {
            jwt: {
                secret: "secret",
            },
        },
    });

    const apolloServer = new ApolloServer({
        schema: neoSchema.schema,
        context: () => ({ ...context, driver, ogm } as Context),
    });

    const client = createTestClient(apolloServer);

    return client;
}

export default server;
