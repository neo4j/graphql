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

const { createServer } = require("http");
const fs = require("fs");
const path = require("path");
const neo4j = require("neo4j-driver");
const { createYoga } = require("graphql-yoga");
const { Neo4jGraphQLSubscriptionsSingleInstancePlugin, Neo4jGraphQL } = require("@neo4j/graphql");

const NEO4J_URL = "bolt://localhost:7687";
const NEO4J_USER = "neo4j";
const NEO4J_PASSWORD = "password";

// Load type definitions
const typeDefs = fs.readFileSync(path.join(__dirname, "typedefs.graphql"), "utf-8");

// Create Neo4j driver
const driver = neo4j.driver(NEO4J_URL, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));

// Magic! Load library based on the type definitions
const neoSchema = new Neo4jGraphQL({
    typeDefs,
    driver,
    plugins: {
        subscriptions: new Neo4jGraphQLSubscriptionsSingleInstancePlugin(), // Add plugin
    },
});

// Generates graphql schema and resolvers, connect to neo4j
neoSchema.getSchema().then((schema) => {
    const yoga = createYoga({
        schema,
    });

    const server = createServer(yoga);

    server.listen(4000, () => {
        console.info("Server is running on http://localhost:4000/graphql");
    });
});
