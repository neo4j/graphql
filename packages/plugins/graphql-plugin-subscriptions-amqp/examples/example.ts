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

// Run with 'ts-node example.ts'
// Requires a running AMQP 0-9 broker
//  - Example RabbitMQ: 'docker-compose up rabbitmq'

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { useServer } from "graphql-ws/lib/use/ws";
import { createServer } from "http";
import { WebSocketServer } from "ws";

// Change the following line:
//  import { Neo4jGraphQL } from "@neo4j/graphql";
import { Neo4jGraphQL } from "../../../graphql/src/index";

import * as neo4j from "neo4j-driver";
import { Neo4jGraphQLSubscriptionsAMQPPlugin } from "../src/index";

const AMQP_CONFIG = {
    hostname: "localhost",
    username: "guest",
    password: "guest",
};

const NEO4J_CREDENTIALS = {
    username: "neo4j",
    url: "bolt://localhost:7687",
    pwd: "dontpanic42",
};

const PORT = 4000;

const typeDefs = `
type Movie {
    title: String! 
    released:Int
    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
    directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
}

type Person {
    name: String! 
    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
}

interface ActedIn @relationshipProperties {
    year: Int
}
`;

const driver = neo4j.driver(NEO4J_CREDENTIALS.url, neo4j.auth.basic(NEO4J_CREDENTIALS.username, NEO4J_CREDENTIALS.pwd));

const neoSchema = new Neo4jGraphQL({
    typeDefs: typeDefs,
    driver,
    plugins: {
        subscriptions: new Neo4jGraphQLSubscriptionsAMQPPlugin({
            connection: AMQP_CONFIG,
            reconnectTimeout: 1000,
            log: true,
        }),
    },
});

async function runApolloServer() {
    const app = express();
    const httpServer = createServer(app);
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: "/graphql",
    });
    const schema = await neoSchema.getSchema();
    // Save the returned server's info so we can shutdown this server later
    const serverCleanup = useServer(
        {
            schema,
            context: (ctx) => {
                return ctx;
            },
        },
        wsServer
    );

    // Set up ApolloServer.
    const server = new ApolloServer({
        schema,
        plugins: [
            // Proper shutdown for the HTTP server.
            ApolloServerPluginDrainHttpServer({ httpServer }),

            // Proper shutdown for the WebSocket server.
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
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
            context: async (req) => ({ req, driverConfig: { database: "neo4j" } }),
        })
    );

    // Now that our HTTP server is fully set up, we can listen to it.
    httpServer.listen(PORT, () => {
        console.log(`Server is now running on http://localhost:${PORT}/graphql`);
    });
}

runApolloServer();
