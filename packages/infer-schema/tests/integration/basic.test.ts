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

import neo4j, { Neo4jError } from "neo4j-driver";
import { inferSchema } from "../../src/index";
import createDriver from "./neo4j";

describe("Infer Schema basic tests", () => {
    test("Throws if no connection", async () => {
        const driver = neo4j.driver("neo4j://non-existent-url", neo4j.auth.basic("", ""));
        await expect(() => inferSchema(driver)).rejects.toBeInstanceOf(Neo4jError);
    });
});
