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

import { gql } from "graphql-tag";
import * as neo4j from "neo4j-driver";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { Neo4jGraphQLApolloFederationPlugin } from "../../../src/index";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

async function main() {
    const typeDefs = gql`
        extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

        type Product @key(fields: "id", resolvable: false) {
            id: ID!
        }

        type Review {
            score: Int!
            description: String!
            product: Product! @relationship(type: "HAS_REVIEW", direction: IN)
        }
    `;

    const auth = neo4j.auth.basic("neo4j", "password");
    const driver = neo4j.driver("neo4j://localhost:7687/neo4j", auth);
    await driver.verifyConnectivity();

    // Aiming for this to be zero argument
    const plugin = new Neo4jGraphQLApolloFederationPlugin(typeDefs, driver, "reviews");

    const library = new Neo4jGraphQL({
        typeDefs,
        driver,
        // For now we have to skip validation
        config: { skipValidateTypeDefs: true, driverConfig: { database: "reviews" } },
        // @ts-ignore: not currently public
        plugins: { federation: plugin },
    });

    const schemaDefinition = await library.getSchemaDefinition();

    const schema = plugin.buildSubgraphSchema(schemaDefinition);

    const server = new ApolloServer({
        schema,
    });

    const { url } = await startStandaloneServer(server, {
        listen: { port: 4002 },
    });
    console.log(`started subgraph server on ${url}`);
}

main();
