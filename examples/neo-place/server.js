require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createServer } = require("http");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const express = require("express");
const { ApolloServer } = require("apollo-server-express");
const { ApolloServerPluginDrainHttpServer } = require("apollo-server-core");

const setupMap = require("./map-setup");
const { getDriver } = require("./get-driver");
const { createEngine } = require("./create-engine");

// Load type definitions
const typeDefs = fs.readFileSync(path.join(__dirname, "typedefs.graphql"), "utf-8");

async function main() {
    try {
        const driver = await getDriver();

        const engine = await createEngine();

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefs,
            driver: driver,
            features: {
                authorization: { key: "super-secret42" },
                subscriptions: engine || true,
            },
        });

        await setupMap(30);
        // Apollo server setup
        const app = express();

        app.use(express.static("dist"));

        const httpServer = createServer(app);

        // Setup websocket server on top of express http server
        const wsServer = new WebSocketServer({
            server: httpServer,
            path: "/graphql",
        });

        // Build Neo4j/graphql schema
        const schema = await neoSchema.getSchema();

        await neoSchema.assertIndexesAndConstraints({ options: { create: true } });

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
            context: ({ req }) => ({ token: req.headers.authorization }),
            plugins: [
                ApolloServerPluginDrainHttpServer({
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

        const PORT = process.env.PORT || 4000;
        httpServer.listen(PORT, () => {
            console.log(`Server is now running on http://localhost:${PORT}/graphql`);
        });
    } catch (error) {
        console.log(error);
    }
}

main();
