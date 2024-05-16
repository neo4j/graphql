require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createServer } = require("http");
const { Neo4jGraphQL } = require("@neo4j/graphql");
const { WebSocketServer } = require("ws");
const { useServer } = require("graphql-ws/lib/use/ws");
const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { ApolloServerPluginDrainHttpServer } = require("@apollo/server/plugin/drainHttpServer");
const { expressMiddleware } = require("@apollo/server/express4");
const setupMap = require("./map-setup");
const { getDriver } = require("./get-driver");
const { createEngine } = require("./create-engine");

// Load type definitions
const typeDefs = fs.readFileSync(path.join(__dirname, "typedefs.graphql"), "utf-8");

async function main() {
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
                ctx.connectionParams.token = ctx.connectionParams.authorization;
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
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => ({ token: req.headers.authorization }),
        })
    );

    const PORT = process.env.PORT || 4000;
    httpServer.listen(PORT, () => {
        console.log(`Server is now running on http://localhost:${PORT}/graphql`);
    });
}

main();
