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

import * as neo4j from "neo4j-driver";

import { typeDefs } from "./type-defs";
import { resolvers } from "./resolvers";
import { startServer } from "./server";

const {
    NEO4J_URI = "neo4j://localhost:7687/neo4j",
    NEO4J_USERNAME = "neo4j",
    NEO4J_PASSWORD = "password",
} = process.env;

const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD));

startServer({ typeDefs, resolvers, driver })
    .then((url) => {
        console.log(`🚀  Server ready at: ${url}`);
    })
    .catch((reason) => console.error(reason));
