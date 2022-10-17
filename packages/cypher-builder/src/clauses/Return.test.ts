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

import * as CypherBuilder from "..";

describe("CypherBuilder Return", () => {
    test("Return columns", () => {
        const node = new CypherBuilder.Node({
            labels: ["MyLabel"],
        });
        const returnQuery = new CypherBuilder.Return(node, new CypherBuilder.Literal(10));

        const queryResult = returnQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"RETURN this0, 10"`);
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Return *", () => {
        const returnQuery = new CypherBuilder.Return("*");

        const queryResult = returnQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"RETURN *"`);
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Alias with a variable", () => {
        const node = new CypherBuilder.Node({
            labels: ["MyLabel"],
        });
        const returnQuery = new CypherBuilder.Return([node, new CypherBuilder.Variable()]);

        const queryResult = returnQuery.build();
        expect(queryResult.cypher).toMatchInlineSnapshot(`"RETURN this0 AS var1"`);
        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});
