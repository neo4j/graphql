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

import { Attribute } from "../../../schema-model/attribute/Attribute";
import { GraphQLBuiltInScalarType, ScalarType } from "../../../schema-model/attribute/AttributeType";
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { CypherField } from "../../../types";
import { cypherResolver } from "./cypher";

describe("Cypher resolver", () => {
    test("should return the correct; type, args and resolve", () => {
        // @ts-ignore
        const field: CypherField = {
            // @ts-ignore
            typeMeta: { name: "Test", pretty: "[Test]" },
            arguments: [],
            isEnum: false,
            isScalar: true,
        };
        const attribute = new Attribute({
            name: "test",
            annotations: {},
            type: new ScalarType(GraphQLBuiltInScalarType.String, true),
            args: [],
        });
        const attributeAdapter = new AttributeAdapter(attribute);
        const result = cypherResolver({ field, attributeAdapter, type: "Query" });
        expect(result.type).toBe("String!");
        expect(result.resolve).toBeInstanceOf(Function);
        expect(result.args).toMatchObject({});
    });
});
