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

describe("CypherBuilder Call", () => {
    test("Wraps query inside Call", () => {
        const idParam = new Cypher.Param("my-id");
        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const createQuery = new Cypher.Create(movieNode).set([movieNode.property("id"), idParam]).return(movieNode);
        const queryResult = new Cypher.Call(createQuery).build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "CALL {
                    CREATE (this0:\`Movie\`)
                    SET
                        this0.id = $param0
                    RETURN this0
                }"
            `);
        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "my-id",
                }
            `);
    });

    test("Nested Call", () => {
        const idParam = new Cypher.Param("my-id");
        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const createQuery = new Cypher.Create(movieNode).set([movieNode.property("id"), idParam]).return(movieNode);
        const nestedCall = new Cypher.Call(createQuery);
        const call = new Cypher.Call(nestedCall);
        const queryResult = call.build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "CALL {
                    CALL {
                        CREATE (this0:\`Movie\`)
                        SET
                            this0.id = $param0
                        RETURN this0
                    }
                }"
            `);
        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "my-id",
                }
            `);
    });

    it("CALL with with", () => {
        const node = new Cypher.Node({ labels: ["Movie"] });

        const matchClause = new Cypher.Match(node)
            .where(Cypher.eq(new Cypher.Param("aa"), new Cypher.Param("bb")))
            .return([node.property("title"), "movie"]);

        const clause = new Cypher.Call(matchClause).innerWith(node);
        const queryResult = clause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "CALL {
                WITH this0
                MATCH (this0:\`Movie\`)
                WHERE $param0 = $param1
                RETURN this0.title AS movie
            }"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "aa",
              "param1": "bb",
            }
        `);
    });
});
