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

import Cypher from "../..";
import { TestClause } from "../../utils/TestClause";
import { OrderBy } from "./OrderBy";

describe("CypherBuilder OrderBy", () => {
    test("OrderBy with skip and limit", () => {
        const movieNode = new Cypher.Node({
            labels: ["Movie"],
        });

        const orderBy = new OrderBy();
        orderBy.addOrderElements([
            [movieNode.property("name"), "DESC"],
            [movieNode.property("age"), "ASC"],
        ]);
        orderBy.skip(10);
        orderBy.limit(5);
        const testClause = new TestClause(orderBy);

        const queryResult = testClause.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`
            "ORDER BY this0.\`name\` DESC, this0.\`age\` ASC
            SKIP 10
            LIMIT 5"
        `);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});
