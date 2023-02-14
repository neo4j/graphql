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

import type {
    DocumentNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { Kind } from "graphql";
import { generateResolveTree } from "../translate/utils/resolveTree";
import getCustomResolverMeta from "./get-custom-resolver-meta";

describe("getCustomResolverMeta", () => {
    const authorType = "Author";
    const bookType = "Book";
    const journalType = "Journal";
    const publicationInterface = "Publication";

    const customResolverField = "publicationsWithAuthor";

    const objects: ObjectTypeDefinitionNode[] = [
        {
            kind: Kind.OBJECT_TYPE_DEFINITION,
            description: undefined,
            name: {
                kind: Kind.NAME,
                value: authorType,
            },
            interfaces: [],
            directives: [],
            fields: [
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "name",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.NAMED_TYPE,
                            name: {
                                kind: Kind.NAME,
                                value: "String",
                            },
                        },
                    },
                    directives: [],
                },
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "publications",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.LIST_TYPE,
                            type: {
                                kind: Kind.NON_NULL_TYPE,
                                type: {
                                    kind: Kind.NAMED_TYPE,
                                    name: {
                                        kind: Kind.NAME,
                                        value: publicationInterface,
                                    },
                                },
                            },
                        },
                    },
                    directives: [
                        {
                            kind: Kind.DIRECTIVE,
                            name: {
                                kind: Kind.NAME,
                                value: "relationship",
                            },
                            arguments: [
                                {
                                    kind: Kind.ARGUMENT,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "type",
                                    },
                                    value: {
                                        kind: Kind.STRING,
                                        value: "WROTE",
                                        block: false,
                                    },
                                },
                                {
                                    kind: Kind.ARGUMENT,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "direction",
                                    },
                                    value: {
                                        kind: Kind.ENUM,
                                        value: "OUT",
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: customResolverField,
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.LIST_TYPE,
                            type: {
                                kind: Kind.NON_NULL_TYPE,
                                type: {
                                    kind: Kind.NAMED_TYPE,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "String",
                                    },
                                },
                            },
                        },
                    },
                    directives: [
                        {
                            kind: Kind.DIRECTIVE,
                            name: {
                                kind: Kind.NAME,
                                value: "customResolver",
                            },
                            arguments: [
                                {
                                    kind: Kind.ARGUMENT,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "requires",
                                    },
                                    value: {
                                        kind: Kind.STRING,
                                        value: "name publications { publicationYear ...on Book { title } ... on Journal { subject } }",
                                        block: false,
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            kind: Kind.OBJECT_TYPE_DEFINITION,
            description: undefined,
            name: {
                kind: Kind.NAME,
                value: bookType,
            },
            interfaces: [
                {
                    kind: Kind.NAMED_TYPE,
                    name: {
                        kind: Kind.NAME,
                        value: publicationInterface,
                    },
                },
            ],
            directives: [],
            fields: [
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "title",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.NAMED_TYPE,
                            name: {
                                kind: Kind.NAME,
                                value: "String",
                            },
                        },
                    },
                    directives: [],
                },
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "publicationYear",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.NAMED_TYPE,
                            name: {
                                kind: Kind.NAME,
                                value: "Int",
                            },
                        },
                    },
                    directives: [],
                },
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "author",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.LIST_TYPE,
                            type: {
                                kind: Kind.NON_NULL_TYPE,
                                type: {
                                    kind: Kind.NAMED_TYPE,
                                    name: {
                                        kind: Kind.NAME,
                                        value: authorType,
                                    },
                                },
                            },
                        },
                    },
                    directives: [
                        {
                            kind: Kind.DIRECTIVE,
                            name: {
                                kind: Kind.NAME,
                                value: "relationship",
                            },
                            arguments: [
                                {
                                    kind: Kind.ARGUMENT,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "type",
                                    },
                                    value: {
                                        kind: Kind.STRING,
                                        value: "WROTE",
                                        block: false,
                                    },
                                },
                                {
                                    kind: Kind.ARGUMENT,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "direction",
                                    },
                                    value: {
                                        kind: Kind.ENUM,
                                        value: "IN",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            kind: Kind.OBJECT_TYPE_DEFINITION,
            description: undefined,
            name: {
                kind: Kind.NAME,
                value: journalType,
            },
            interfaces: [
                {
                    kind: Kind.NAMED_TYPE,
                    name: {
                        kind: Kind.NAME,
                        value: publicationInterface,
                    },
                },
            ],
            directives: [],
            fields: [
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "subject",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.NAMED_TYPE,
                            name: {
                                kind: Kind.NAME,
                                value: "String",
                            },
                        },
                    },
                    directives: [],
                },
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "publicationYear",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.NAMED_TYPE,
                            name: {
                                kind: Kind.NAME,
                                value: "Int",
                            },
                        },
                    },
                    directives: [],
                },
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "author",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.LIST_TYPE,
                            type: {
                                kind: Kind.NON_NULL_TYPE,
                                type: {
                                    kind: Kind.NAMED_TYPE,
                                    name: {
                                        kind: Kind.NAME,
                                        value: authorType,
                                    },
                                },
                            },
                        },
                    },
                    directives: [
                        {
                            kind: Kind.DIRECTIVE,
                            name: {
                                kind: Kind.NAME,
                                value: "relationship",
                            },
                            arguments: [
                                {
                                    kind: Kind.ARGUMENT,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "type",
                                    },
                                    value: {
                                        kind: Kind.STRING,
                                        value: "WROTE",
                                        block: false,
                                    },
                                },
                                {
                                    kind: Kind.ARGUMENT,
                                    name: {
                                        kind: Kind.NAME,
                                        value: "direction",
                                    },
                                    value: {
                                        kind: Kind.ENUM,
                                        value: "IN",
                                    },
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ];

    const interfaces: InterfaceTypeDefinitionNode[] = [
        {
            kind: Kind.INTERFACE_TYPE_DEFINITION,
            description: undefined,
            name: {
                kind: Kind.NAME,
                value: publicationInterface,
            },
            interfaces: [],
            directives: [],
            fields: [
                {
                    kind: Kind.FIELD_DEFINITION,
                    description: undefined,
                    name: {
                        kind: Kind.NAME,
                        value: "publicationYear",
                    },
                    arguments: [],
                    type: {
                        kind: Kind.NON_NULL_TYPE,
                        type: {
                            kind: Kind.NAMED_TYPE,
                            name: {
                                kind: Kind.NAME,
                                value: "Int",
                            },
                        },
                    },
                    directives: [],
                },
            ],
        },
    ];

    const unions: UnionTypeDefinitionNode[] = [];

    const document: DocumentNode = {
        kind: Kind.DOCUMENT,
        definitions: [...objects, ...interfaces, ...unions],
    };

    const object = objects.find((obj) => obj.name.value === authorType) as ObjectTypeDefinitionNode;

    const resolvers = {
        [customResolverField]: () => 25,
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
                value: customResolverField,
            },
        };

        const result = getCustomResolverMeta({
            document,
            field,
            object,
            objects,
            validateResolvers: true,
            interfaces,
            unions,
            customResolvers: resolvers,
        });

        expect(result).toBeUndefined();
    });
    test("should return undefined if no requires argument", () => {
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
                value: customResolverField,
            },
        };

        const result = getCustomResolverMeta({
            document,
            field,
            object,
            objects,
            validateResolvers: true,
            interfaces,
            unions,
            customResolvers: resolvers,
        });

        expect(result).toBeUndefined();
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
                value: customResolverField,
            },
        };

        const result = getCustomResolverMeta({
            document,
            field,
            object,
            objects,
            validateResolvers: true,
            interfaces,
            unions,
            customResolvers: resolvers,
        });

        expect(result).toMatchObject({
            requiredFields: requiredFields.reduce((res, field) => {
                res = { ...res, ...generateResolveTree({ name: field }) };
                return res;
            }, {}),
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
                value: customResolverField,
            },
        };

        const resolvers = {};

        expect(() =>
            getCustomResolverMeta({
                document,
                field,
                object,
                objects,
                validateResolvers: true,
                interfaces,
                unions,
                customResolvers: resolvers,
            })
        ).toThrow(`Custom resolver for ${customResolverField} has not been provided`);
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
                value: customResolverField,
            },
        };

        const resolvers = {
            [publicationInterface]: {
                [customResolverField]: () => "Hello World!",
            },
        };

        expect(() =>
            getCustomResolverMeta({
                document,
                field,
                object,
                objects,
                validateResolvers: true,
                interfaces,
                unions,
                customResolvers: resolvers,
            })
        ).toThrow(`Custom resolver for ${customResolverField} has not been provided`);
    });

    test("Check does not throw error if validateResolvers false", () => {
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
                value: customResolverField,
            },
        };

        const resolvers = {
            [publicationInterface]: {
                [customResolverField]: () => "Hello World!",
            },
        };

        expect(() =>
            getCustomResolverMeta({
                document,
                field,
                object,
                objects,
                validateResolvers: false,
                interfaces,
                unions,
                customResolvers: resolvers,
            })
        ).not.toThrow();
    });
});
