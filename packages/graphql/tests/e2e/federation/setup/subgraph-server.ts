/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import type { GraphQLSchema } from "graphql";
import type { Server } from "./server";

export class SubgraphServer implements Server {
    server: ApolloServer;
    url?: string;

    constructor(schema: GraphQLSchema) {
        this.server = new ApolloServer({
            schema,
            includeStacktraceInErrorResponses: true,
        });
    }

    public async start(): Promise<string> {
        const { url } = await startStandaloneServer(this.server, {
            // eslint-disable-next-line @typescript-eslint/require-await
            context: async ({ req }) => ({ token: req.headers.authorization }),
            // assign a random unused port
            listen: { port: 0 },
        });
        this.url = url;
        return url;
    }

    public async stop(): Promise<void> {
        await this.server.stop();
    }
}
