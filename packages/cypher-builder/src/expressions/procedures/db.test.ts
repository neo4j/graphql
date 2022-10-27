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

import Cypher, { Param } from "../..";

describe("db procedures", () => {
    describe("FullTextQueryNodes", () => {
        test("Simple fulltext", () => {
            const targetNode = new Cypher.Node({ labels: ["Movie"] });
            const fulltextClause = new Cypher.db.FullTextQueryNodes(
                targetNode,
                "my-text-index",
                new Param("This is a lovely phrase")
            );

            const { cypher, params } = fulltextClause.build();

            expect(cypher).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(
                    \\"my-text-index\\",
                    $param0
                ) YIELD node as this0

                            

                            
                        "
            `);
            expect(params).toMatchInlineSnapshot(`
                Object {
                  "param0": "This is a lovely phrase",
                }
            `);
        });
    });
});
