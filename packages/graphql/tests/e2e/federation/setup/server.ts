/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ApolloServer } from "@apollo/server";

export interface Server {
    server: ApolloServer;
    start(): Promise<string>;
    stop(): Promise<void>;
}
