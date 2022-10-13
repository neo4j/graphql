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

import type { FieldDefinitionNode } from "graphql";
import { Kind } from "graphql";
import getCustomResolverMeta, { ERROR_MESSAGE } from "./get-custom-resolver-meta";

describe("getCustomResolverMeta", () => {
    test("should return undefined if no directive found", () => {
        // @ts-ignore
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: { value: "RANDOM 1" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
            name: {
                kind: Kind.NAME,
                value: "someFieldName",
            },
        };

        const resolvers = {
            someFieldName: () => 25,
        };

        const result = getCustomResolverMeta(field, resolvers);

        expect(result).toBeUndefined();
    });

    test("should throw if requires not a list 123", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "customResolver",
                        // @ts-ignore
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "requires" },
                            // @ts-ignore
                            value: { kind: Kind.BOOLEAN },
                        },
                    ],
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
            name: {
                kind: Kind.NAME,
                value: "someFieldName",
            },
        };

        const resolvers = {
            someFieldName: () => 25,
        };

        expect(() => getCustomResolverMeta(field, resolvers)).toThrow(ERROR_MESSAGE);
    });

    test("should throw if requires not a list of strings", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "customResolver",
                        // @ts-ignore
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "requires" },
                            // @ts-ignore
                            value: {
                                kind: Kind.LIST,
                                values: [
                                    { kind: Kind.STRING, value: "field1" },
                                    { kind: Kind.STRING, value: "field2" },
                                    { kind: Kind.BOOLEAN, value: true },
                                ],
                            },
                        },
                    ],
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
            name: {
                kind: Kind.NAME,
                value: "someFieldName",
            },
        };

        const resolvers = {
            someFieldName: () => [],
        };

        expect(() => getCustomResolverMeta(field, resolvers)).toThrow(ERROR_MESSAGE);
    });

    test("should return the correct meta if no requires argument", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "customResolver",
                        // @ts-ignore
                    },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
            name: {
                kind: Kind.NAME,
                value: "someFieldName",
            },
        };

        const resolvers = {
            someFieldName: () => "someValue",
        };

        const result = getCustomResolverMeta(field, resolvers);

        expect(result).toMatchObject({
            requiredFields: [],
        });
    });

    test("should return the correct meta with requires argument", () => {
        const requiredFields = ["field1", "field2", "field3"];
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "customResolver",
                        // @ts-ignore
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "requires" },
                            // @ts-ignore
                            value: {
                                kind: Kind.LIST,
                                values: requiredFields.map((requiredField) => ({
                                    kind: Kind.STRING,
                                    value: requiredField,
                                })),
                            },
                        },
                    ],
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
            name: {
                kind: Kind.NAME,
                value: "someFieldName",
            },
        };

        const resolvers = {
            someFieldName: () => 1.01,
        };

        const result = getCustomResolverMeta(field, resolvers);

        expect(result).toMatchObject({
            requiredFields,
        });
    });
    // TODO
    // throws error if no customResolver

    // throws error if resolver not a functions
});
