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

import path from "path";

import { Neo4jGraphQL } from "../../src";
import { typeDefs } from "./typedefs";
import type * as Performance from "./types";
import { WorkloadGenerator } from "./utils/WorkloadGenerator";
import { collectTests } from "./utils/collect-test-files";
async function main() {
    const neoSchema = new Neo4jGraphQL({
        typeDefs,
        experimental: true,
    });
    const gqltests: Performance.TestInfo[] = await collectTests(path.join(__dirname, "graphql"));
    await new WorkloadGenerator(neoSchema).generateWorkload(gqltests);
}

main().catch((err) => console.error(err));
