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
import neo4j from "neo4j-driver";
// eslint-disable-next-line import/no-unresolved
import { Neo4jGraphQL } from "@neo4j/graphql";
import { getLargeSchema } from "../typedefs.js";
import { createServer } from "http";
import { createYoga } from "graphql-yoga";

async function main() {
    const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "password"), {
        maxConnectionPoolSize: 100,
    });

    const neoSchema = new Neo4jGraphQL({
        typeDefs: getLargeSchema(1),
        driver,
        config: {
            addMeasurementsToExtension: true,
        },
    });
    const schema = await neoSchema.getSchema();

    const yoga = createYoga({
        schema,
    });

    const server = createServer(yoga);

    server.listen(4000, () => {
        console.info("Server is running on http://localhost:4000/graphql");
    });
}

main().catch((err) => {
    console.error(err);
});
