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

describe("parseEnvironmentQueryOptions", () => {
    let env: NodeJS.ProcessEnv;

    beforeEach(() => {
        env = process.env;
    });

    afterEach(() => {
        process.env = env;
    });

    test("throws an Error if invalid Cypher query option in environment", () => {
        process.env.CYPHER_RUNTIME = "invalid";

        // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
        const { parseEnvironmentQueryOptions } = require("./parse-environment-query-options");

        expect(() => parseEnvironmentQueryOptions()).toThrow(
            "Invalid Cypher query option in environment variable CYPHER_RUNTIME, expected one of: [interpreted, slotted, pipelined]"
        );
    });
});
