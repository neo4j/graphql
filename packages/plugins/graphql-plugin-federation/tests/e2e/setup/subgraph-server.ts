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
import type { GraphQLSchema } from "graphql";
import type { Server } from "./server";

export class SubgraphServer implements Server {
    port: number;
    server: ApolloServer;

    constructor(schema: GraphQLSchema, port: number) {
        this.server = new ApolloServer({
            schema,
        });
        this.port = port;
    }

    public async start(): Promise<string> {
        const { url } = await startStandaloneServer(this.server, {
            listen: { port: this.port },
        });
        console.log(`started subgraph server on ${url}`);
        return url;
    }

    public async stop(): Promise<void> {
        return this.server.stop();
    }
}
