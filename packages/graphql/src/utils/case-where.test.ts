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

import Cypher from "@neo4j/cypher-builder";
import { caseWhere } from "./case-where";

describe("caseWhere", () => {
    test("should translate a WHERE filter using the CASE operator", () => {
        const outputVariables = [new Cypher.Variable(), new Cypher.Variable()];
        const clause = caseWhere(Cypher.eq(new Cypher.Literal(true), new Cypher.Literal(true)), outputVariables);
        const { cypher } = clause.build("myPrefix");
        expect(cypher).toMatchInlineSnapshot(`
            "WITH *, CASE true = true
                WHEN true THEN [ myPrefixvar0, myPrefixvar1 ]
                ELSE [ NULL, NULL ]
            END AS myPrefixvar2
            WITH *, myPrefixvar2[0] AS myPrefixvar0, myPrefixvar2[1] AS myPrefixvar1"
        `);
    });
});
