import { ApolloServer } from "apollo-server-express";
import { OGM } from "@neo4j/graphql-ogm";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { typeDefs, resolvers } from "../../src/gql";
import { Context } from "../../src/types";
import * as config from "../../src/config";

async function server(driver, context = {}) {
    const ogm = new OGM({
        typeDefs,
        driver,
    });

    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        resolvers,
        config: {
            jwt: {
                secret: config.NEO4J_GRAPHQL_JWT_SECRET,
            },
        },
    });

    const schema = await neoSchema.getSchema();
    await ogm.init();

    const apolloServer = new ApolloServer({
        schema,
        context: () => ({ ...context, driver, ogm } as Context),
    });

    return apolloServer;
}

export default server;
