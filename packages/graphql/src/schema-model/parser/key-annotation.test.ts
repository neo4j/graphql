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

import type { DirectiveNode } from "graphql";
import { Kind } from "graphql";
import { parseKeyAnnotation } from "./key-annotation";

describe("parseKeyAnnotation", () => {
    it("should parse when there is only one directive", () => {
        const directives: readonly DirectiveNode[] = [
            {
                kind: Kind.DIRECTIVE,
                name: {
                    kind: Kind.NAME,
                    value: "key",
                },
                arguments: [
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "fields",
                        },
                        value: {
                            kind: Kind.STRING,
                            value: "sku variation { id }",
                        },
                    },
                ],
            },
        ];
        const keyAnnotation = parseKeyAnnotation(directives);
        expect(keyAnnotation.fields).toBe("sku variation { id }");
        expect(keyAnnotation.resolvable).toBe(true);
    });
    it("should parse when there are two directives", () => {
        const directives: readonly DirectiveNode[] = [
            {
                kind: Kind.DIRECTIVE,
                name: {
                    kind: Kind.NAME,
                    value: "key",
                },
                arguments: [
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "fields",
                        },
                        value: {
                            kind: Kind.STRING,
                            value: "id",
                        },
                    },
                ],
            },
            {
                kind: Kind.DIRECTIVE,
                name: {
                    kind: Kind.NAME,
                    value: "key",
                },
                arguments: [
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "fields",
                        },
                        value: {
                            kind: Kind.STRING,
                            value: "sku variation { id }",
                        },
                    },
                ],
            },
        ];
        const keyAnnotation = parseKeyAnnotation(directives);
        expect(keyAnnotation.fields).toBe("id, sku variation { id }");
        expect(keyAnnotation.resolvable).toBe(true);
    });
    it("should parse resolvable when there is only one directive", () => {
        const directives: readonly DirectiveNode[] = [
            {
                kind: Kind.DIRECTIVE,
                name: {
                    kind: Kind.NAME,
                    value: "key",
                },
                arguments: [
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "fields",
                        },
                        value: {
                            kind: Kind.STRING,
                            value: "sku variation { id }",
                        },
                    },
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "resolvable",
                        },
                        value: {
                            kind: Kind.BOOLEAN,
                            value: false,
                        },
                    },
                ],
            },
        ];
        const keyAnnotation = parseKeyAnnotation(directives);
        expect(keyAnnotation.fields).toBe("sku variation { id }");
        expect(keyAnnotation.resolvable).toBe(false);
    });
    it("should parse resolvable when there are two directives", () => {
        const directives: readonly DirectiveNode[] = [
            {
                kind: Kind.DIRECTIVE,
                name: {
                    kind: Kind.NAME,
                    value: "key",
                },
                arguments: [
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "fields",
                        },
                        value: {
                            kind: Kind.STRING,
                            value: "sku variation { id }",
                        },
                    },
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "resolvable",
                        },
                        value: {
                            kind: Kind.BOOLEAN,
                            value: false,
                        },
                    },
                ],
            },
            {
                kind: Kind.DIRECTIVE,
                name: {
                    kind: Kind.NAME,
                    value: "key",
                },
                arguments: [
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "fields",
                        },
                        value: {
                            kind: Kind.STRING,
                            value: "id",
                        },
                    },
                    {
                        kind: Kind.ARGUMENT,
                        name: {
                            kind: Kind.NAME,
                            value: "resolvable",
                        },
                        value: {
                            kind: Kind.BOOLEAN,
                            value: true,
                        },
                    },
                ],
            },
        ];
        const keyAnnotation = parseKeyAnnotation(directives);
        expect(keyAnnotation.fields).toBe("sku variation { id }, id");
        expect(keyAnnotation.resolvable).toBe(true);
    });
});
