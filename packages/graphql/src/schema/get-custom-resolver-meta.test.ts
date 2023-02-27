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

import {
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
    Kind,
} from "graphql";
import { generateResolveTree } from "../translate/utils/resolveTree";
import getCustomResolverMeta, { INVALID_SELECTION_SET_ERROR } from "./get-custom-resolver-meta";

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
    test("should return no required fields if no requires argument", () => {
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
            field,
            object,
            objects,
            validateResolvers: true,
            interfaces,
            unions,
            customResolvers: resolvers,
        });

        expect(result).toEqual({
            requiredFields: {},
        });
    });
    test("should return the correct meta when a list of required fields is provided", () => {
        const requiredFields = "name";
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
                                kind: Kind.STRING,
                                value: requiredFields,
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
            field,
            object,
            objects,
            validateResolvers: true,
            interfaces,
            unions,
            customResolvers: resolvers,
        });

        expect(result).toEqual({
            requiredFields: generateResolveTree({ name: requiredFields }),
        });
    });

    test("should return the correct meta when a selection set of required fields provided", () => {
        const requiredFields = `name publications { publicationYear ...on ${bookType} { title } ... on ${journalType} { subject } }`;
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
                                kind: Kind.STRING,
                                value: requiredFields,
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
            field,
            object,
            objects,
            validateResolvers: true,
            interfaces,
            unions,
            customResolvers: resolvers,
        });

        expect(result).toEqual({
            requiredFields: {
                name: {
                    name: "name",
                    alias: "name",
                    args: {},
                    fieldsByTypeName: {},
                },
                publications: {
                    name: "publications",
                    alias: "publications",
                    args: {},
                    fieldsByTypeName: {
                        Publication: {
                            publicationYear: {
                                name: "publicationYear",
                                alias: "publicationYear",
                                args: {},
                                fieldsByTypeName: {},
                            },
                        },
                        Book: {
                            title: {
                                name: "title",
                                alias: "title",
                                args: {},
                                fieldsByTypeName: {},
                            },
                        },
                        Journal: {
                            subject: {
                                name: "subject",
                                alias: "subject",
                                args: {},
                                fieldsByTypeName: {},
                            },
                        },
                    },
                },
            },
        });
    });

    test("should throw an error if a non-existant field is passed to the required selection set", () => {
        const requiredFields = `name publications doesNotExist { publicationYear ...on ${bookType} { title } ... on ${journalType} { subject } }`;
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
                                kind: Kind.STRING,
                                value: requiredFields,
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

        expect(() =>
            getCustomResolverMeta({
                field,
                object,
                objects,
                validateResolvers: true,
                interfaces,
                unions,
                customResolvers: resolvers,
            })
        ).toThrow(INVALID_SELECTION_SET_ERROR);
    });

    test("Check throws error if customResolver is not provided", () => {
        const requiredFields = "name";
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
                                kind: Kind.STRING,
                                value: requiredFields,
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
        const requiredFields = "name";
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
                                kind: Kind.STRING,
                                value: requiredFields,
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
        const requiredFields = "name";
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
                                kind: Kind.STRING,
                                value: requiredFields,
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
