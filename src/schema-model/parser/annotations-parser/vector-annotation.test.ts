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

import { Kind, type DirectiveNode } from "graphql";
import { parseVectorAnnotation } from "./vector-annotation";

describe("parseVectorAnnotation", () => {
    it("should parse correctly", () => {
        const directive: DirectiveNode = {
            kind: Kind.DIRECTIVE,
            name: { kind: Kind.NAME, value: "vector" },
            arguments: [
                {
                    kind: Kind.ARGUMENT,
                    name: { kind: Kind.NAME, value: "indexes" },
                    value: {
                        kind: Kind.LIST,
                        values: [
                            {
                                kind: Kind.OBJECT,
                                fields: [
                                    {
                                        kind: Kind.OBJECT_FIELD,
                                        name: { kind: Kind.NAME, value: "indexName" },
                                        value: { kind: Kind.STRING, value: "ProductName" },
                                    },
                                    {
                                        kind: Kind.OBJECT_FIELD,
                                        name: { kind: Kind.NAME, value: "embeddingProperty" },
                                        value: { kind: Kind.STRING, value: "name" },
                                    },
                                    {
                                        kind: Kind.OBJECT_FIELD,
                                        name: { kind: Kind.NAME, value: "queryName" },
                                        value: { kind: Kind.STRING, value: "myQueryName" },
                                    },
                                    {
                                        kind: Kind.OBJECT_FIELD,
                                        name: { kind: Kind.NAME, value: "provider" },
                                        value: { kind: Kind.ENUM, value: "OPEN_AI" },
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        };
        const vectorAnnotation = parseVectorAnnotation(directive);
        expect(vectorAnnotation).toEqual({
            name: "vector",
            indexes: [
                {
                    indexName: "ProductName",
                    embeddingProperty: "name",
                    queryName: "myQueryName",
                    provider: "OpenAI",
                },
            ],
        });
    });
});
