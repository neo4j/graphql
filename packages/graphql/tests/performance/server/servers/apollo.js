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

"use strict";

// eslint-disable-next-line import/named
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import neo4j from "neo4j-driver";
// eslint-disable-next-line import/no-unresolved
import { Neo4jGraphQL } from "@neo4j/graphql";
import { getLargeSchema } from "../typedefs.js";

async function main() {
    const { NEO_USER = "neo4j", NEO_PASSWORD = "password", NEO_URL = "bolt://localhost:7687" } = process.env;

    const driver = neo4j.driver(NEO_URL, neo4j.auth.basic(NEO_USER, NEO_PASSWORD), {
        maxConnectionPoolSize: 100,
    });

    const neoSchema = new Neo4jGraphQL({
        typeDefs: getLargeSchema(1),
        driver,
    });
    const schema = await neoSchema.getSchema();

    const extensionsPlugin = {
        async requestDidStart() {
            return {
                async willSendResponse(requestContext) {
                    const { response } = requestContext;
                    if (response.body.kind === "single" && "data" in response.body.singleResult) {
                        response.body.singleResult.extensions = requestContext.contextValue.extensions;
                    }
                    return response;
                },
            };
        },
    };

    await neoSchema.assertIndexesAndConstraints({ options: { create: true } });

    const server = new ApolloServer({
        schema,
        plugins: [extensionsPlugin],
    });

    const { url } = await startStandaloneServer(server, {
        context: async ({ req }) => ({ token: req.headers.token }),
        listen: { port: 4000 },
    });

    console.log(`🚀 Server ready at ${url}`);
}

main().catch((err) => {
    console.error(err);
});
