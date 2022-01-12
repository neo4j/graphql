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

import { buildNodeStatement } from "./build-node-statement";
import { Context } from "../../types";
import { NodeBuilder } from "../../../tests/utils/builders/node-builder";
import { ContextBuilder } from "../../../tests/utils/builders/context-builder";

describe("build node statement", () => {
    let context: Context;

    beforeAll(() => {
        context = new ContextBuilder().instance();
    });

    test("build simple node statement", () => {
        const statement = buildNodeStatement({
            varName: "this",
            context,
        });

        expect(statement[0]).toBe("(this)");
        expect(statement[1]).toEqual({});
    });

    test("build node statement with labels", () => {
        const node = new NodeBuilder({ name: "TestLabel" }).instance();
        const statement = buildNodeStatement({
            varName: "this",
            context,
            node,
        });

        expect(statement[0]).toBe("(this:TestLabel)");
        expect(statement[1]).toEqual({});
    });

    test("build node statement with parameters", () => {
        const node = new NodeBuilder({ name: "TestLabel" }).instance();
        const statement = buildNodeStatement({
            varName: "this",
            context,
            node,
            parameters: {
                name: "User",
                age: 34,
            },
        });

        expect(statement[0]).toBe(`(this:TestLabel { name: $this_node_name, age: $this_node_age })`);
        expect(statement[1]).toEqual({
            this_node_name: "User",
            this_node_age: 34,
        });
    });
});
