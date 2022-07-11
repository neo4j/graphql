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

import { and, or } from "../operations/boolean";
import { gt, lt, eq } from "../operations/comparison";

import * as CypherBuilder from "../CypherBuilder";

describe("CypherBuilder clauses", () => {
    it("Match Where", () => {
        const node = new CypherBuilder.Node({ labels: ["Movie"] });

        const param = new CypherBuilder.Param(1);
        const clause = new CypherBuilder.Match(node)
            .where(
                and(
                    or(gt(param, new CypherBuilder.Param(2)), lt(param, new CypherBuilder.Param(4))),
                    eq(new CypherBuilder.Param("aa"), new CypherBuilder.Param("bb"))
                )
            )
            .return(node, ["title"], "movie");

        const queryResult = clause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE (($param0 > $param1 OR $param0 < $param2) AND $param3 = $param4)
            RETURN this0 {.title} AS movie"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": 1,
              "param1": 2,
              "param2": 4,
              "param3": "aa",
              "param4": "bb",
            }
        `);
    });

    it("Create Set", () => {
        const node = new CypherBuilder.Node({ labels: ["Movie"] });

        const clause = new CypherBuilder.Create(node)
            .set(
                [node.property("title"), new CypherBuilder.Param("The Matrix")],
                [node.property("runtime"), new CypherBuilder.Param(120)]
            )
            .return(node, ["title"], "movie");

        const queryResult = clause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "CREATE (this0:\`Movie\`)
            SET
                this0.title = $param0,
                this0.runtime = $param1
            RETURN this0 {.title} AS movie"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "The Matrix",
              "param1": 120,
            }
        `);
    });

    it("Merge OnCreate Set", () => {
        const node = new CypherBuilder.Node({ labels: ["Movie"] });

        const clause = new CypherBuilder.Merge(node)
            .onCreate(
                [node.property("title"), new CypherBuilder.Param("The Matrix")],
                [node.property("runtime"), new CypherBuilder.Param(120)]
            )
            .return(node, ["title"], "movie");

        const queryResult = clause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MERGE (this0:\`Movie\`)
            ON CREATE SET
                this0.title = $param0,
                this0.runtime = $param1
            RETURN this0 {.title} AS movie"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "The Matrix",
              "param1": 120,
            }
        `);
    });

    it("CALL with with", () => {
        const node = new CypherBuilder.Node({ labels: ["Movie"] });

        const param = new CypherBuilder.Param(1);
        const matchClause = new CypherBuilder.Match(node)
            .where(
                and(
                    or(gt(param, new CypherBuilder.Param(2)), lt(param, new CypherBuilder.Param(4))),
                    eq(new CypherBuilder.Param("aa"), new CypherBuilder.Param("bb"))
                )
            )
            .return(node, ["title"], "movie");

        const clause = new CypherBuilder.Call(matchClause).with(node);
        const queryResult = clause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "CALL {
                WITH this0
                MATCH (this0:\`Movie\`)
                WHERE (($param0 > $param1 OR $param0 < $param2) AND $param3 = $param4)
                RETURN this0 {.title} AS movie
            }"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": 1,
              "param1": 2,
              "param2": 4,
              "param3": "aa",
              "param4": "bb",
            }
        `);
    });
});
