/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApolloGateway, IntrospectAndCompose, RemoteGraphQLDataSource } from "@apollo/gateway";
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
