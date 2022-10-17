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

import * as CypherBuilder from "..";

describe("CypherBuilder RawCypher Examples", () => {
    test("Creating a custom query with RawCypher", () => {
        const releasedParam = new CypherBuilder.Param(1999);

        const rawCypher = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
            // The environment is available, so CypherBuilder params can be used in RawCypher along with custom params
            const releasedParamId = releasedParam.getCypher(env); // Gets the raw Cypher for the param

            // Composes the custom query, with a custom param (title_param) and a CypherBuilder param
            const customCypher = `MATCH(n) WHERE n.title=$title_param AND n.released=${releasedParamId}`;

            // Custom params that need to be added to the environment
            const customParams = {
                title_param: "The Matrix",
            };

            return [customCypher, customParams];
        });

        const queryResult = rawCypher.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(
            `"MATCH(n) WHERE n.title=$title_param AND n.released=$param0"`
        );

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": 1999,
              "title_param": "The Matrix",
            }
        `);
    });
});
