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

import cypherResolver from "./cypher";
import { BaseField } from "../../types";

describe("Cypher resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const field: BaseField = {
            // @ts-ignore
            typeMeta: { name: "Test", pretty: "[Test]" },
            arguments: [],
        };

        const result = cypherResolver({ field, statement: "", type: "Query" });
        expect(result.type).toEqual(field.typeMeta.pretty);
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({});
    });
});
