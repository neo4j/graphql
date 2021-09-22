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
import { Context } from "../types";
import { NodeBuilder } from "../utils/test";

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

        // @ts-ignore
        const context: Context = { neoSchema: { nodes: [] } };

        const result = createWhereAndParams({ whereInput, varName, node, context });

        expect(result[0]).toEqual(`WHERE this.title = $this_title`);
        expect(result[1]).toMatchObject({ this_title: whereInput.title });
    });
});
