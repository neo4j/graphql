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
import Cypher from "../..";

describe("Map Projection", () => {
    test("Project empty map", () => {
        const mapProjection = new Cypher.MapProjection(new Cypher.Variable(), []);

        const queryResult = new TestClause(mapProjection).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0 {  }"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Project map with extra values only", () => {
        const var1 = new Cypher.Variable();
        const var2 = new Cypher.NamedVariable("NamedVar");

        const mapProjection = new Cypher.MapProjection(new Cypher.Variable(), [], {
            myValue: var1,
            namedValue: var2,
        });

        const queryResult = new TestClause(mapProjection).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0 { myValue: var1, namedValue: NamedVar }"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Project map with properties in projection and extra values", () => {
        const node = new Cypher.Node({});

        const mapProjection = new Cypher.MapProjection(new Cypher.Variable(), ["title", "name"], {
            namedValue: Cypher.count(node),
        });
        const queryResult = new TestClause(mapProjection).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(`"var0 { .title, .name, namedValue: count(this1) }"`);

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Map Projection in return", () => {
        const mapVar = new Cypher.Variable();
        const node = new Cypher.Node({});

        const mapProjection = new Cypher.MapProjection(mapVar, ["title", "name"], {
            namedValue: Cypher.count(node),
        });

        const queryResult = new Cypher.Return([mapProjection, mapVar]).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(
            `"RETURN var0 { .title, .name, namedValue: count(this1) } AS var0"`
        );

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });

    test("Convert to map with properties in projection and extra values", () => {
        const node = new Cypher.Node({});

        const mapProjection = new Cypher.MapProjection(new Cypher.Variable(), ["title", "name"], {
            namedValue: Cypher.count(node),
        });
        const queryResult = new TestClause(mapProjection.toMap()).build();

        expect(queryResult.cypher).toMatchInlineSnapshot(
            `"{ title: var0.title, name: var0.name, namedValue: count(this1) }"`
        );

        expect(queryResult.params).toMatchInlineSnapshot(`Object {}`);
    });
});
