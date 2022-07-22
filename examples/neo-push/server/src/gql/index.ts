import { ApolloServer } from "apollo-server-express";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { OGM } from "@neo4j/graphql-ogm";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { driver } from "../neo4j";
import type { Context } from "../types";
import * as User from "./User";
import * as Blog from "./Blog";
import * as Post from "./Post";
import * as Comment from "./Comment";
import * as config from "../config";

export const typeDefs = [User.typeDefs, Blog.typeDefs, Post.typeDefs, Comment.typeDefs];

export const resolvers = {
    ...User.resolvers,
};

export const ogm = new OGM({
    typeDefs,
    driver,
});

export async function getServer(): Promise<ApolloServer> {
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

    const server: ApolloServer = new ApolloServer({
        schema: await neoSchema.getSchema(),
        context: ({ req }) => ({ ogm, driver, req } as Context),
    });

    return server;
}
