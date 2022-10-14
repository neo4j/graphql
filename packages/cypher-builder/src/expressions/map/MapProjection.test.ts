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

import { TestClause } from "../../utils/TestClause";
import * as CypherBuilder from "../../CypherBuilder";

describe("Map Projection", () => {
    test("Project empty map", () => {
        const mapProjection = new CypherBuilder.MapProjection(new CypherBuilder.Variable(), []);

        const queryResult = new TestClause(mapProjection).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0 {  }"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Project map with variables and nodes in projection", () => {
        const var1 = new CypherBuilder.Variable();
        const var2 = new CypherBuilder.NamedVariable("NamedVar");
        const node = new CypherBuilder.Node({});

        const mapProjection = new CypherBuilder.MapProjection(new CypherBuilder.Variable(), [var1, var2, node]);

        const queryResult = new TestClause(mapProjection).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0 { .var1, .NamedVar, .this2 }"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Project map with extra values only", () => {
        const var1 = new CypherBuilder.Variable();
        const var2 = new CypherBuilder.NamedVariable("NamedVar");

        const mapProjection = new CypherBuilder.MapProjection(new CypherBuilder.Variable(), [], {
            myValue: var1,
            namedValue: var2,
        });

        const queryResult = new TestClause(mapProjection).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0 { myValue: var1, namedValue: NamedVar }"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Project map with variables in projection and extra values", () => {
        const var1 = new CypherBuilder.Variable();
        const var2 = new CypherBuilder.NamedVariable("NamedVar");
        const node = new CypherBuilder.Node({});

        const mapProjection = new CypherBuilder.MapProjection(new CypherBuilder.Variable(), [var1, var2], {
            namedValue: CypherBuilder.count(node),
        });
        const queryResult = new TestClause(mapProjection).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0 { .var2, .NamedVar, namedValue: count(this1) }"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Map Projection in return", () => {
        const mapVar = new CypherBuilder.Variable();
        const var1 = new CypherBuilder.Variable();
        const var2 = new CypherBuilder.NamedVariable("NamedVar");
        const node = new CypherBuilder.Node({});

        const mapProjection = new CypherBuilder.MapProjection(mapVar, [var1, var2], {
            namedValue: CypherBuilder.count(node),
        });

        const queryResult = new CypherBuilder.Return([mapProjection, mapVar]).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(
            `"RETURN var0 { .var2, .NamedVar, namedValue: count(this1) } AS var0"`
        );

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});
