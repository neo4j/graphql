/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from "@apollo/gateway";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import type { Server } from "./server";

type Subgraph = {
    name: string;
    url: string;
};

export class GatewayServer implements Server {
    server: ApolloServer;
    url?: string;

    constructor(subgraphs: Subgraph[]) {
        class AuthenticatedDataSource extends RemoteGraphQLDataSource {
            willSendRequest({ request, context }) {
                request.http.headers.set("authorization", context.token);
            }
        }

        const gateway = new ApolloGateway({
            supergraphSdl: new IntrospectAndCompose({
                subgraphs,
            }),
            buildService({ url }) {
                return new AuthenticatedDataSource({ url });
            },
        });

        this.server = new ApolloServer({
            gateway,
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
