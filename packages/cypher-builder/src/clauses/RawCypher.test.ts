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

import Cypher from "..";

describe("RawCypher", () => {
    it("Return a simple string as a clause", () => {
        const rawQuery = new Cypher.RawCypher(() => {
            const cypherStr = "RETURN $myParam as title";
            return [
                cypherStr,
                {
                    param: "My Title",
                },
            ];
        });

        const queryResult = rawQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"RETURN $myParam as title"`);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param": "My Title",
            }
        `);
    });

    test("Create a custom query with RawCypher callback", () => {
        const releasedParam = new Cypher.Param(1999);

        const rawCypher = new Cypher.RawCypher((env: Cypher.Environment) => {
            const releasedParamId = releasedParam.getCypher(env); // Gets the raw Cypher for the param

            const customCypher = `MATCH(n) WHERE n.title=$title_param AND n.released=${releasedParamId}`;

            const customParams = {
                title_param: "The Matrix",
            };

            return [customCypher, customParams];
        });

        const queryResult = rawCypher.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(
            `"MATCH(n) WHERE n.title=$title_param AND n.released=$param0"`,
        );

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": 1999,
              "title_param": "The Matrix",
            }
        `);
    });
});
