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

const fs = require("fs");
const path = require("path");
const { createServer } = require("http");
const neo4j = require("neo4j-driver");
const { Neo4jGraphQL, Neo4jGraphQLSubscriptionsSingleInstancePlugin } = require("@neo4j/graphql");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const { Neo4jGraphQLSubscriptionsAMQPPlugin } = require("@neo4j/graphql-plugin-subscriptions-amqp");

const NEO4J_URL = "bolt://localhost:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASSWORD = "password";

const AMQP_URI = "amqp://localhost";

const plugin = new Neo4jGraphQLSubscriptionsAMQPPlugin({
    connection: AMQP_URI,
});

//Alternatively, we can remove the AMQP server if we are only using a development server
// const plugin = new new Neo4jGraphQLSubscriptionsSingleInstancePlugin();

if (!process.argv[2]) throw new Error("Usage node server.js [port]");

// Load type definitions
const typeDefs = fs.readFileSync(path.join(__dirname, "typedefs.graphql"), "utf-8");

const driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const neoSchema = new Neo4jGraphQL({
    typeDefs: typeDefs,
    driver,
    plugins: {
        subscriptions: plugin,
    },
});

async function main() {
    // Apollo server setup
    const app = express();
    const httpServer = createServer(app);

    // Setup websocket server on top of express http server
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: "/graphql",
    });

    // Build Neo4j/graphql schema
    const schema = await neoSchema.getSchema();
    const serverCleanup = useServer(
        {
            schema,
        },
        wsServer
    );

    const server = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({
                // Graceful stop
                httpServer,
            }),
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
    server.applyMiddleware({
        app,
    });

    const PORT = process.argv[2];
    httpServer.listen(PORT, () => {
        console.log(`Server is now running on http://localhost:${PORT}/graphql`);
    });
}

main();
