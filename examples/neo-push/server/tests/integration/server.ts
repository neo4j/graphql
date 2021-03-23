import { ApolloServer } from "apollo-server-express";
import { createTestClient } from "apollo-server-testing";
import { ogm, neoSchema } from "../../src/graphql";
import * as neo4j from "./neo4j";
import { Context } from "../../src/types";

async function server(context = {}) {
    const driver = await neo4j.connect();

    const apolloServer = new ApolloServer({
        schema: neoSchema.schema,
        context: () => ({ ...context, driver, ogm } as Context),
    });

    const client = createTestClient(apolloServer);

    return client;
}

export default server;
