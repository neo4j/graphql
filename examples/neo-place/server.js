const fs = require('fs');
const path = require('path');
const { createServer } = require("http");
const { EventEmitter } = require('events');
const neo4j = require('neo4j-driver');
const { Neo4jGraphQL } = require('@neo4j/graphql');
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const express = require('express');
const  { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");
const setupMap=require('./map-setup')
// Local Subscriptions
class SubscriptionsPlugin {
    constructor() {
        this.events = new EventEmitter();
    }

    publish(eventMeta) {
        this.events.emit(eventMeta.event, eventMeta);
    }
}

const NEO4J_URL = "bolt://localhost:7687"
const NEO4J_USER = "neo4j"
const NEO4J_PASSWORD = "dontpanic42"

// Load type definitions
const typeDefs = fs.readFileSync(path.join(__dirname, "typedefs.graphql"), 'utf-8');


const driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

const neoSchema = new Neo4jGraphQL({
    typeDefs: typeDefs,
    driver,
    plugins: {
        subscriptions: new SubscriptionsPlugin(), // Add plugin
    },
});

async function main() {
    await setupMap(30);
    // Apollo server setup
    const app = express();
    app.use(express.static('dist'))
    const httpServer = createServer(app);

    // Setup websocket server on top of express http server
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: "/graphql",
    });

    // Build Neo4j/graphql schema
    const schema = await neoSchema.getSchema();
    const serverCleanup = useServer({
        schema
    }, wsServer);

    const server = new ApolloServer({
        schema,
        plugins: [
            ApolloServerPluginDrainHttpServer({
                httpServer
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
        app
    });

    const PORT = 4000;
    httpServer.listen(PORT, () => {
        console.log(`Server is now running on http://localhost:${PORT}/graphql`);
    });
}

main();
