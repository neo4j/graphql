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

import * as CypherBuilder from "./CypherBuilder";

describe("CypherBuilder", () => {
    describe("Create", () => {
        test("Create Node", () => {
            const idParam = new CypherBuilder.Param("my-id");
            const movieNode = new CypherBuilder.Node({
                labels: ["Movie"],
                parameters: { test: new CypherBuilder.Param("test-value"), id: idParam },
            });

            const createQuery = new CypherBuilder.Create(movieNode, { id: idParam }).return(movieNode);

            const queryResult = createQuery.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`
                "CREATE (this0:\`Movie\` { test: $param0, id: $param1 })
                SET this0.id = $param1
                RETURN this0"
                `);

            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "test-value",
                  "param1": "my-id",
                }
            `);
        });
    });

    describe("Merge", () => {
        test("Merge relationship", () => {
            const node1 = new CypherBuilder.Node({
                labels: ["MyLabel"],
            });
            const node2 = new CypherBuilder.Node({});

            const relationship = new CypherBuilder.Relationship({ source: node1, target: node2 });

            const query = new CypherBuilder.Merge(relationship).onCreate({
                source: {
                    age: new CypherBuilder.Param(23),
                    name: new CypherBuilder.Param("Keanu"),
                },
                relationship: {
                    screentime: new CypherBuilder.Param(10),
                },
            });

            const queryResult = query.build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MERGE (this1)-[this0]->(this2)
                ON CREATE SET
                        this1.age = $param0,
                this1.name = $param1,
                this0.screentime = $param2
                "
            `);
            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": 23,
                  "param1": "Keanu",
                  "param2": 10,
                }
            `);
        });
    });

    describe("Call", () => {
        test("Wraps query inside Call", () => {
            const idParam = new CypherBuilder.Param("my-id");
            const movieNode = new CypherBuilder.Node({
                labels: ["Movie"],
            });

            const createQuery = new CypherBuilder.Create(movieNode, { id: idParam }).return(movieNode);

            const queryResult = new CypherBuilder.Call(createQuery).build();
            expect(queryResult.cypher).toMatchInlineSnapshot(`
                "CALL {
                	CREATE (this0:\`Movie\`)
                SET this0.id = $param0
                RETURN this0
                	RETURN COUNT(*)
                }"
            `);
            expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "my-id",
                }
            `);
        });
    });
});
