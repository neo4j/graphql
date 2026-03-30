/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { createData } from "./data";

export async function startServer({ typeDefs, resolvers, driver }): Promise<string> {
    await createData(driver);

    const neo4jgraphql = new Neo4jGraphQL({ typeDefs, resolvers, driver });

    const schema = await neo4jgraphql.getSubgraphSchema();

    const server = new ApolloServer({
        schema,
    });

    const { url } = await startStandaloneServer(server, {
        listen: { port: 4001 },
    });

    return url;
}
