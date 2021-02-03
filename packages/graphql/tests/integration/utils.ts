// eslint-disable-next-line import/no-extraneous-dependencies
import { ApolloServer } from "apollo-server";
import { Driver } from "neo4j-driver";
import { NeoSchema } from "../../src/classes";

const constructTestServer = (neoSchema: NeoSchema, driver: Driver, context = {}) => {
    const server = new ApolloServer({
        schema: neoSchema.schema,
        context: ({ req }) => ({ driver, req, ...context }),
    });

    return server;
};

export { constructTestServer };
