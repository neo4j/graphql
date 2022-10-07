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

import * as Cypher from "../../CypherBuilder";

describe("CypherBuilder concat", () => {
    it("Should concatenate 2 clauses", () => {
        const node = new Cypher.Node({ labels: ["Movie"] });

        const clause = new Cypher.Match(node).where(Cypher.eq(new Cypher.Param("aa"), new Cypher.Param("bb")));
        const returnClause = new Cypher.Return([node.property("title"), "movie"]);

        const query = Cypher.concat(clause, returnClause);

        const queryResult = query.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE $param0 = $param1
            RETURN this0.title AS movie"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "aa",
              "param1": "bb",
            }
        `);
    });
});
