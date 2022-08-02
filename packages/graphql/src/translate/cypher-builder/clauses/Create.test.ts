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

describe("CypherBuilder Create", () => {
    test("Create Node", () => {
        const idParam = new CypherBuilder.Param("my-id");
        const movieNode = new CypherBuilder.Node({
            labels: ["Movie"],
        });

        const createQuery = new CypherBuilder.Create(movieNode, {
            test: new CypherBuilder.Param("test-value"),
            id: idParam,
        })
            .set(
                [movieNode.property("title"), new CypherBuilder.Param("The Matrix")],
                [movieNode.property("runtime"), new CypherBuilder.Param(120)]
            )
            .return(movieNode);

        const queryResult = createQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "CREATE (this0:\`Movie\` { test: $param0, id: $param1 })
            SET
                this0.title = $param2,
                this0.runtime = $param3
            RETURN this0"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`
            Object {
              "param0": "test-value",
              "param1": "my-id",
              "param2": "The Matrix",
              "param3": 120,
            }
        `);
    });

    test("Create Node with null property", () => {
        const idParam = new CypherBuilder.Param(null);
        const testParam = new CypherBuilder.Param(null);
        const nullStringParam = new CypherBuilder.Param("null");

        const movieNode = new CypherBuilder.Node({
            labels: ["Movie"],
        });

        const createQuery = new CypherBuilder.Create(movieNode, {
            id: idParam,
        })
            .set([movieNode.property("test"), testParam], [movieNode.property("nullStr"), nullStringParam])
            .return(movieNode);

        const queryResult = createQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
                "CREATE (this0:\`Movie\` { id: NULL })
                SET
                    this0.test = NULL,
                    this0.nullStr = $param0
                RETURN this0"
            `);

        expect(queryResult.params).toMatchInlineSnapshot(`
                Object {
                  "param0": "null",
                }
            `);
    });
});
