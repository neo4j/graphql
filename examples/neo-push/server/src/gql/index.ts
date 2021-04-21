import { ApolloServer } from "apollo-server-express";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { OGM } from "@neo4j/graphql-ogm";
import { driver } from "../neo4j";
import { Context } from "../types";
import * as User from "./User";
import * as Blog from "./Blog";
import * as Post from "./Post";
import * as Comment from "./Comment";
import * as config from "../config";

export const typeDefs = [User.typeDefs, Blog.typeDefs, Post.typeDefs, Comment.typeDefs];

const resolvers = {
    ...User.resolvers,
};

export const ogm = new OGM({
    typeDefs,
    driver,
    debug: config.NODE_ENV === "development",
});

export const neoSchema = new Neo4jGraphQL({
    typeDefs,
    resolvers,
    debug: config.NODE_ENV === "development",
    config: {
        jwt: {
            secret: config.NEO4J_GRAPHQL_JWT_SECRET,
        },
    },
});

export const server: ApolloServer = new ApolloServer({
    schema: neoSchema.schema,
    context: ({ req }) => ({ ogm, driver, req } as Context),
});
