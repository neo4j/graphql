import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { OGM } from "@neo4j/graphql-ogm";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import * as config from "../config";
import { driver } from "../neo4j";
import type { Context } from "../types";
import * as Blog from "./Blog";
import * as Comment from "./Comment";
import * as Post from "./Post";
import * as User from "./User";

export const typeDefs = [User.typeDefs, Blog.typeDefs, Post.typeDefs, Comment.typeDefs];

export const resolvers = {
    ...User.resolvers,
};

export const ogm = new OGM({
    typeDefs,
    driver,
});

export async function startServer(): Promise<void> {
    await ogm.init();

    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        resolvers,
        plugins: {
            auth: new Neo4jGraphQLAuthJWTPlugin({
                secret: config.NEO4J_GRAPHQL_JWT_SECRET,
            }),
        },
    });

    const apolloServer = new ApolloServer<Context>({
        schema: await neoSchema.getSchema(),
    });

    startStandaloneServer(apolloServer, {
        context: async (req) => ({ ogm, driver, req }),
        listen: { port: config.HTTP_PORT },
    });
}
