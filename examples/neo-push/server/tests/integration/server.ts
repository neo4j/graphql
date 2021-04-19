import { ApolloServer } from "apollo-server-express";
import { createTestClient } from "apollo-server-testing";
import { OGM } from "@neo4j/graphql-ogm";
import { neoSchema, typeDefs } from "../../src/gql";
import { Context } from "../../src/types";

function server(driver, context = {}) {
    const ogm = new OGM({
        typeDefs,
        config: { driver },
    });

    const apolloServer = new ApolloServer({
        schema: neoSchema.schema,
        context: () => ({ ...context, driver, ogm } as Context),
    });

    const client = createTestClient(apolloServer);

    return client;
}

export default server;
