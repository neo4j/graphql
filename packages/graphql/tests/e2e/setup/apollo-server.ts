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

/* eslint-disable import/no-extraneous-dependencies */
import { createServer, Server } from "http";
import { AddressInfo, WebSocketServer } from "ws";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { ApolloServerPluginDrainHttpServer } from "apollo-server-core";
import { useServer } from "graphql-ws/lib/use/ws";
import { Neo4jGraphQL } from "../../../src";

export interface TestGraphQLServer {
    path: string;
    wsPath: string;
    start(port?: number): Promise<void>;
    close(): Promise<void>;
}

export class ApolloTestServer implements TestGraphQLServer {
    private schema: Neo4jGraphQL;
    private server?: Server;
    private _path?: string;
    private wsServer?: WebSocketServer;

    constructor(schema: Neo4jGraphQL) {
        this.schema = schema;
    }

    public get path(): string {
        if (!this._path) throw new Error("Server is not running");
        return this._path;
    }

    public get wsPath(): string {
        return this.path.replace("http://", "ws://");
    }

    async start(): Promise<void> {
        if (this.server) throw new Error(`Server already running on "${this.path}"`);
        const app = express();
        const httpServer = createServer(app);
        const wsServer = new WebSocketServer({
            server: httpServer,
            path: "/graphql",
        });
        this.server = httpServer;
        this.wsServer = wsServer;

        const schema = await this.schema.getSchema();

        const serverCleanup = useServer({ schema }, wsServer);
        const server = new ApolloServer({
            schema,
            plugins: [
                ApolloServerPluginDrainHttpServer({ httpServer }),
                {
                    serverWillStart() {
                        return Promise.resolve({
                            async drainServer() {
                                await serverCleanup.dispose();
                            },
                        });
                    },
                },
            ],
        });
        await server.start();
        server.applyMiddleware({ app });

        return new Promise<void>((resolve) => {
            const port = 0; // Automatically assigns a free port
            httpServer.listen(port, () => {
                const serverAddress = httpServer.address() as AddressInfo;
                this._path = `http://localhost:${serverAddress.port}${server.graphqlPath}`;
                resolve();
            });
        });
    }

    async close(): Promise<void> {
        await this.closeWebsocketServer();
        await this.closeHttpServer();
    }

    private closeWebsocketServer(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.wsServer) {
                // Remove all clients
                this.wsServer.clients.forEach((socket) => {
                    socket.close();
                });
                this.wsServer.close((err) => {
                    if (err) reject(err);
                    this.wsServer = undefined;
                    resolve();
                });
            } else {
                this.wsServer = undefined;
                resolve();
            }
        });
    }

    private closeHttpServer(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) reject(err);
                    resolve();
                });
                this.server = undefined;
                this._path = undefined;
            } else {
                resolve();
            }
        });
    }
}
/* eslint-enable import/no-extraneous-dependencies */
