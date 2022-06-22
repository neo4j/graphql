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

import * as CypherBuilder from "../CypherBuilder";

describe("Where clauses", () => {
    test("Match node with IN", () => {
        const titleParam = new CypherBuilder.Param(["my-name"]);

        const movieNode = new CypherBuilder.Node({
            labels: ["Movie"],
        });

        const matchQuery = new CypherBuilder.Match(movieNode)
            .where([movieNode, { title: CypherBuilder.in(titleParam) }])
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title IN $param0
            RETURN this0"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": Array [
                "my-name",
              ],
            }
        `);
    });
});
