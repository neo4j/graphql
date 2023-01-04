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

import type { FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { Kind } from "graphql";
import getCustomResolverMeta, { ERROR_MESSAGE } from "./get-custom-resolver-meta";

describe("getCustomResolverMeta", () => {
    const fieldName = "someFieldName";
    const objectName = "someObjectName";
    const interfaceName = "anInterface";
    const object: ObjectTypeDefinitionNode = {
        kind: Kind.OBJECT_TYPE_DEFINITION,
        name: {
            kind: Kind.NAME,
            value: objectName,
        },
        interfaces: [
            {
                kind: Kind.NAMED_TYPE,
                name: {
                    kind: Kind.NAME,
                    value: interfaceName,
                },
            },
        ],
    };

    const resolvers = {
        [fieldName]: () => 25,
    };
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
                value: fieldName,
            },
        };

        const result = getCustomResolverMeta(field, object, resolvers);

        expect(result).toBeUndefined();
    });
    test("should throw if requires not a list - all strings", () => {
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
                value: fieldName,
            },
        };

        expect(() => getCustomResolverMeta(field, object, resolvers)).toThrow(ERROR_MESSAGE);
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
                value: fieldName,
            },
        };

        expect(() => getCustomResolverMeta(field, object, resolvers)).toThrow(ERROR_MESSAGE);
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
                value: fieldName,
            },
        };

        const result = getCustomResolverMeta(field, object, resolvers);

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
                value: fieldName,
            },
        };

        const result = getCustomResolverMeta(field, object, resolvers);

        expect(result).toMatchObject({
            requiredFields,
        });
    });
    test("Check throws error if customResolver is not provided", () => {
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
                value: fieldName,
            },
        };

        const resolvers = {};

        expect(() => getCustomResolverMeta(field, object, resolvers)).toThrow(
            `Custom resolver for ${fieldName} has not been provided`
        );
    });
    test("Check throws error if customResolver defined on interface", () => {
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
                value: fieldName,
            },
        };

        const resolvers = {
            [interfaceName]: {
                [fieldName]: () => "Hello World!",
            },
        };

        expect(() => getCustomResolverMeta(field, object, resolvers)).toThrow(
            `Custom resolver for ${fieldName} has not been provided`
        );
    });
});
