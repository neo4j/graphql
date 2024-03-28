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

import { TestHelper } from "../utils/tests-helper";

/*
 * File not imported in project, and to be used in test pipelines to teardown target database.
 *
 *   `ts-node tests/integration/teardown.ts`
 */

const teardown = async () => {
    const testHelper = new TestHelper();

    try {
        console.log("Clearing down database...");
        await testHelper.executeCypher("MATCH (n) DETACH DELETE n");
    } finally {
        await testHelper.close();
    }
};

teardown().then(
    () => console.log("Successfully cleared down database."),
    (reason) => console.log(`Error encountered whilst clearing down database: ${reason}`)
);
