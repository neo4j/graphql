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

import { Neo4jGraphQL } from "@neo4j/graphql";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
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
