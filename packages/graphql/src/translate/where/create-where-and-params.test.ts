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

import createWhereAndParams from "./create-where-and-params";
import { ContextBuilder } from "../../../tests/utils/builders/context-builder";
import { NodeBuilder } from "../../../tests/utils/builders/node-builder";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";

describe("createWhereAndParams", () => {
    test("should be a function", () => {
        expect(createWhereAndParams).toBeInstanceOf(Function);
    });

    test("should return the correct clause with 1 param", () => {
        const whereInput = {
            title: "some title",
        };

        const varName = "this";

        const node = new NodeBuilder().instance();

        const context = new ContextBuilder({}).instance();

        const result = createWhereAndParams({ whereInput, varName, node, context });

        expect(result[0]).toBe(`WHERE this.title = $this_param0`);
        expect(result[1]).toBe("");
        expect(result[2]).toMatchObject({ this_param0: whereInput.title });
    });

    test("should return a clause with the correct idField when using the `id` where argument on a global node", () => {
        const varName = "this";

        const node = new NodeBuilder({
            name: "Movie",
            primitiveFields: [],
            isGlobalNode: true,
            globalIdField: "title",
        }).instance();

        const whereInput = {
            id: node.toGlobalId("some title"),
        };

        const result = createWhereAndParams({
            whereInput,
            varName,
            node,
            context: {} as Neo4jGraphQLTranslationContext,
        });

        expect(result[0]).toBe(`WHERE this.title = $this_param0`);
        expect(result[1]).toBe("");
        expect(result[2]).toMatchObject({ this_param0: "some title" });
    });
});
