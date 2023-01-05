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

import Cypher from "../src";
import { TestClause } from "../src/utils/TestClause";

describe("Params", () => {
    test("Ignore unused parameters", () => {
        const param1 = new Cypher.Param(1999);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const param2 = new Cypher.Param(2000); // Param created bu not used by cypher builder

        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const query = new Cypher.Create(movieNode).set(
            [movieNode.property("released"), param1] // Explicitly defines the node property
        );

        const { params } = query.build();

        expect(params).toMatchInlineSnapshot(`
            Object {
              "param0": 1999,
            }
        `);
    });

    test("use named param twice", () => {
        const param1 = new Cypher.NamedParam("auth");
        const var1 = new Cypher.Variable();

        const clause1 = new TestClause(param1, var1);
        const var2 = new Cypher.Variable();
        const clause2 = new TestClause(param1, var2);
        const { cypher, params } = Cypher.concat(clause1, clause2).build();

        expect(cypher).toMatchInlineSnapshot(`
            "$authvar0
            $authvar1"
        `);
        expect(params).toMatchInlineSnapshot(`Object {}`);
    });
});
