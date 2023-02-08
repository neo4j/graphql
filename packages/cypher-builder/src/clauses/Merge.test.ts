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

describe("CypherBuilder Merge", () => {
    test("Merge node", () => {
        const node = new Cypher.Node({
            labels: ["MyLabel"],
        });

        const query = new Cypher.Merge(node).onCreate([node.property("age"), new Cypher.Param(23)]);

        const queryResult = query.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MERGE (this0:\`MyLabel\`)
                ON CREATE SET
                    this0.age = $param0"
            `);
        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": 23,
                }
            `);
    });

    test("Merge node with parameters", () => {
        const node = new Cypher.Node({
            labels: ["MyLabel"],
        });

        const nodeProps = {
            test: new Cypher.Param("test"),
        };

        const query = new Cypher.Merge(new Cypher.Pattern(node).withProperties(nodeProps)).onCreate([
            node.property("age"),
            new Cypher.Param(23),
        ]);

        const queryResult = query.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "MERGE (this0:\`MyLabel\` { test: $param0 })
                ON CREATE SET
                    this0.age = $param1"
            `);
        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "test",
                  "param1": 23,
                }
            `);
    });

    test("Merge relationship", () => {
        const node1 = new Cypher.Node({
            labels: ["MyLabel"],
        });
        const node2 = new Cypher.Node({});

        const relationship = new Cypher.Relationship();
        const pattern = new Cypher.Pattern(node1).withoutLabels().related(relationship).to(node2);
        const query = new Cypher.Merge(pattern)
            .onCreate(
                [node1.property("age"), new Cypher.Param(23)],
                [node1.property("name"), new Cypher.Param("Keanu")],
                [relationship.property("screentime"), new Cypher.Param(10)]
            )
            .return([node1.property("title"), "movie"]);

        const queryResult = query.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "MERGE (this0)-[this1]->(this2)
            ON CREATE SET
                this0.age = $param0,
                this0.name = $param1,
                this1.screentime = $param2
            RETURN this0.title AS movie"
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
