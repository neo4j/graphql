/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import type { ExpressMiddlewareOptions } from "@as-integrations/express4";
import { expressMiddleware } from "@as-integrations/express4";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { type DocumentNode } from "graphql";
import { getComplexity } from "graphql-query-complexity";
import { useServer } from "graphql-ws/lib/use/ws";
import type { Server } from "http";
import { createServer } from "http";
import type { AddressInfo } from "ws";
import { WebSocketServer } from "ws";
import type { Neo4jGraphQL } from "../../../src";
import { DefaultComplexityEstimators } from "../../../src/classes";
import { ADD_CYPHER_VERSION_PREFIX } from "../../utils/constants";

export interface TestGraphQLServer {
    path: string;
    wsPath: string;
    start(port?: number): Promise<void>;
    close(): Promise<void>;
    computeQueryComplexity(query: DocumentNode): Promise<number | undefined>;
}

type CustomContext = ExpressMiddlewareOptions<any>["context"];

export class ApolloTestServer implements TestGraphQLServer {
    private schema: Neo4jGraphQL;
    private server?: Server;
    private _path?: string;
    private wsServer?: WebSocketServer;
    private customContext?: CustomContext;
    private useEstimators: boolean;
    private wsContext?: (ctx: any) => any;

    constructor(
        schema: Neo4jGraphQL,
        customContext?: CustomContext,
        useEstimators?: boolean,
        wsContext?: (ctx: any) => any
    ) {
        this.schema = schema;
        this.customContext = customContext;
        this.useEstimators = useEstimators ?? false;
        this.wsContext = wsContext;
    }

    public get path(): string {
        if (!this._path) throw new Error("Server is not running");
        return this._path;
    }

    public get wsPath(): string {
        return this.path.replace("http://", "ws://");
    }

    public async computeQueryComplexity(query: DocumentNode): Promise<number | undefined> {
        const schema = await this.schema.getSchema();
        if (this.useEstimators) {
            return getComplexity({
                schema,
                query,
                variables: {},
                estimators: DefaultComplexityEstimators,
            });
        }
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

        const useEstimators = this.useEstimators;
        const schema = await this.schema.getSchema();

        const wsContext = this.wsContext ?? ((ctx) => ctx);
        const serverCleanup = useServer(
            {
                schema,
                context: (ctx) => {
                    return wsContext(ctx);
                },
            },
            wsServer
        );
        const server = new ApolloServer({
            schema,
            plugins: [
                {
                    requestDidStart() {
                        return Promise.resolve({
                            didResolveOperation({ request, document }) {
                                if (useEstimators) {
                                    const complexity = getComplexity({
                                        schema,
                                        query: document,
                                        variables: request.variables,
                                        estimators: DefaultComplexityEstimators,
                                    });

                                    if (complexity > 100) {
                                        throw new Error(
                                            `Query is too complex: ${complexity}. Maximum allowed complexity is 100.`
                                        );
                                    }
                                }
                                return Promise.resolve();
                            },
                        });
                    },
                },
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
                context: this.customContext
                    ? async (ctx) => {
                          const customContext = await this.customContext!(ctx);
                          return {
                              cypherQueryOptions: {
                                  addVersionPrefix: ADD_CYPHER_VERSION_PREFIX,
                              },
                              ...customContext,
                          };
                      }
                    : // eslint-disable-next-line @typescript-eslint/require-await
                      async ({ req }) => {
                          return {
                              req,
                              token: req.headers.authorization,
                              cypherQueryOptions: {
                                  addVersionPrefix: ADD_CYPHER_VERSION_PREFIX,
                              },
                          };
                      },
            })
        );

        const port = 0; // Automatically assigns a free port
        return new Promise<void>((resolve) =>
            httpServer.listen({ port }, () => {
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
