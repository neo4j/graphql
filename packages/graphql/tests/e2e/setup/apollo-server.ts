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
import type { ExpressMiddlewareOptions } from "@apollo/server/express4";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { useServer } from "graphql-ws/lib/use/ws";
import type { Server } from "http";
import { createServer } from "http";
import type { AddressInfo } from "ws";
import { WebSocketServer } from "ws";
import type { Neo4jGraphQL } from "../../../src";

export interface TestGraphQLServer {
    path: string;
    wsPath: string;
    start(port?: number): Promise<void>;
    close(): Promise<void>;
}

type CustomContext = ExpressMiddlewareOptions<any>["context"];

export class ApolloTestServer implements TestGraphQLServer {
    private schema: Neo4jGraphQL;
    private server?: Server;
    private _path?: string;
    private wsServer?: WebSocketServer;
    private customContext?: CustomContext;

    constructor(schema: Neo4jGraphQL, customContext?: CustomContext) {
        this.schema = schema;
        this.customContext = customContext;
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

        const serverCleanup = useServer(
            {
                schema,
                context: (ctx) => {
                    return ctx;
                },
            },
            wsServer
        );
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

        app.use(
            "/graphql",
            cors(),
            bodyParser.json(),
            expressMiddleware(server, {
                // eslint-disable-next-line @typescript-eslint/require-await
                context: this.customContext ? this.customContext : async ({ req }) => ({ req }),
            })
        );

        return new Promise<void>((resolve) =>
            httpServer.listen({ port: 0 }, () => {
                const serverAddress = httpServer.address() as AddressInfo;
                this._path = `http://localhost:${serverAddress.port}/graphql`;
                resolve();
            })
        );
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
