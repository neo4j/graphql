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

import * as Cypher from "../CypherBuilder";

describe("CypherBuilder Match", () => {
    test("Match node", () => {
        const idParam = new Cypher.Param("my-id");
        const nameParam = new Cypher.Param("my-name");
        const ageParam = new Cypher.Param(5);

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode, { test: new Cypher.Param("test-value") })
            .where(movieNode, { id: idParam, name: nameParam, age: ageParam })
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MATCH (this0:\`Movie\` { test: $param0 })
                WHERE ((this0.id = $param1 AND this0.name = $param2) AND this0.age = $param3)
                RETURN this0"
            `);

        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "test-value",
                  "param1": "my-id",
                  "param2": "my-name",
                  "param3": 5,
                }
            `);
    });

    test("Match node with alias", () => {
        const idParam = new Cypher.Param("my-id");
        const nameParam = new Cypher.Param("my-name");

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode, { test: new Cypher.Param("test-value") })
            .where(movieNode, { id: idParam, name: nameParam })
            .return([movieNode.property("name"), "myAlias"]);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\` { test: $param0 })
            WHERE (this0.id = $param1 AND this0.name = $param2)
            RETURN this0.name AS myAlias"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "test-value",
                  "param1": "my-id",
                  "param2": "my-name",
                }
            `);
    });

    test("Match node with and and or in where with top level properties", () => {
        const idParam = new Cypher.Param("my-id");
        const nameParam = new Cypher.Param("my-name");
        const ageParam = new Cypher.Param(5);
        const descriptionParam = new Cypher.Param("A description");

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const movieId = movieNode.property("id");
        const movieName = movieNode.property("name");
        const movieAge = movieNode.property("age");

        const matchQuery = new Cypher.Match(movieNode)
            .where(
                Cypher.and(
                    Cypher.and(
                        Cypher.eq(movieId, idParam),
                        Cypher.or(Cypher.eq(movieName, nameParam), Cypher.eq(movieAge, ageParam))
                    ),
                    Cypher.eq(movieNode.property("description"), descriptionParam)
                )
            )
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MATCH (this0:\`Movie\`)
                WHERE ((this0.id = $param0 AND (this0.name = $param1 OR this0.age = $param2)) AND this0.description = $param3)
                RETURN this0"
            `);

        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "my-id",
                  "param1": "my-name",
                  "param2": 5,
                  "param3": "A description",
                }
            `);
    });

    test("Match node with simple NOT", () => {
        const nameParam = new Cypher.Param("my-name");

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode)
            .where(Cypher.not(Cypher.eq(movieNode.property("name"), nameParam)))
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE NOT (this0.name = $param0)
            RETURN this0"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "my-name",
                }
            `);
    });

    test("Match node with NOT and OR operator", () => {
        const nameParam = new Cypher.Param("my-name");
        const ageParam = new Cypher.Param(5);

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode)
            .where(
                Cypher.not(
                    Cypher.or(
                        Cypher.eq(movieNode.property("age"), ageParam),
                        Cypher.eq(movieNode.property("name"), nameParam)
                    )
                )
            )
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MATCH (this0:\`Movie\`)
                WHERE NOT (this0.age = $param0 OR this0.name = $param1)
                RETURN this0"
            `);

        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": 5,
                  "param1": "my-name",
                }
            `);
    });

    test("Match with null values", () => {
        const testParam = new Cypher.Param(null);

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode, { test: testParam })
            .where(Cypher.isNull(movieNode.property("name")))
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MATCH (this0:\`Movie\` { test: NULL })
                WHERE this0.name IS NULL
                RETURN this0"
            `);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    it("Match Where with complex operation", () => {
        const node = new Cypher.Node({ labels: ["Movie"] });

        const param = new Cypher.Param(1);
        const clause = new Cypher.Match(node)
            .where(
                Cypher.and(
                    Cypher.or(Cypher.gt(param, new Cypher.Param(2)), Cypher.lt(param, new Cypher.Param(4))),
                    Cypher.eq(new Cypher.Param("aa"), new Cypher.Param("bb"))
                )
            )
            .return([node.property("title"), "movie"]);

        const queryResult = clause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE (($param0 > $param1 OR $param0 < $param2) AND $param3 = $param4)
            RETURN this0.title AS movie"
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

    test("Match where with property and not", () => {
        const node = new Cypher.Node({ labels: ["Movie"] });

        const queryMatch = new Cypher.Match(node).where(
            Cypher.not(Cypher.eq(node.property("title"), new Cypher.Param("Matrix")))
        );

        const queryResult = queryMatch.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE NOT (this0.title = $param0)"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "Matrix",
            }
        `);
    });

    test("Match node with mathematical operator", () => {
        const yearParam = new Cypher.Param(2000);

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode)
            .where(Cypher.eq(movieNode.property("released"), Cypher.plus(new Cypher.Literal(10), yearParam)))
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.released = 10 + $param0
            RETURN this0"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": 2000,
            }
        `);
    });

    test("Match node with order", () => {
        const nameParam = new Cypher.Param("arthur");

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode)
            .where(movieNode, { name: nameParam })
            .return(movieNode)
            .orderBy([movieNode.property("age"), "DESC"]);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.name = $param0
            RETURN this0
            ORDER BY this0.age DESC"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "arthur",
            }
        `);
    });

    test("Match and delete with return", () => {
        const idParam = new Cypher.Param("my-id");
        const nameParam = new Cypher.Param("my-name");

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode)
            .where(movieNode, { id: idParam, name: nameParam })
            .delete(movieNode)
            .return(new Cypher.Literal(5));

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE (this0.id = $param0 AND this0.name = $param1)
            DELETE this0
            RETURN 5"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "my-id",
              "param1": "my-name",
            }
        `);
    });

    test("Match and detach delete", () => {
        const idParam = new Cypher.Param("my-id");
        const nameParam = new Cypher.Param("my-name");

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode)
            .where(movieNode, { id: idParam, name: nameParam })
            .detachDelete(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE (this0.id = $param0 AND this0.name = $param1)
            DETACH DELETE this0"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "my-id",
              "param1": "my-name",
            }
        `);
    });

    test("Match with remove", () => {
        const idParam = new Cypher.Param("my-id");
        const nameParam = new Cypher.Param("my-name");

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.Match(movieNode)
            .where(movieNode, { id: idParam, name: nameParam })
            .remove(movieNode.property("name"))
            .return(movieNode.property("id"));

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE (this0.id = $param0 AND this0.name = $param1)
            REMOVE this0.name
            RETURN this0.id"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "my-id",
              "param1": "my-name",
            }
        `);
    });
    test("Optional Match", () => {
        const idParam = new Cypher.Param("my-id");
        const nameParam = new Cypher.Param("my-name");
        const ageParam = new Cypher.Param(5);

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const matchQuery = new Cypher.OptionalMatch(movieNode, { test: new Cypher.Param("test-value") })
            .where(movieNode, { id: idParam, name: nameParam, age: ageParam })
            .return(movieNode);

        const queryResult = matchQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "OPTIONAL MATCH (this0:\`Movie\` { test: $param0 })
            WHERE ((this0.id = $param1 AND this0.name = $param2) AND this0.age = $param3)
            RETURN this0"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "test-value",
                  "param1": "my-id",
                  "param2": "my-name",
                  "param3": 5,
                }
            `);
    });
});
