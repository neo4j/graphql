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
import getRelationshipMeta from "./get-relationship-meta";

describe("getRelationshipMeta", () => {
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
        };

        const result = getRelationshipMeta(field);

        expect(result).toBeUndefined();
    });

    test("should throw relationship has no arguments", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: { value: "relationship", arguments: [] },
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
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship has no arguments");
    });

    test("should throw direction required", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship direction required");
    });

    test("should throw direction not a string", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.BOOLEAN },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship direction not a enum");
    });

    test("should throw direction invalid", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "INVALID!" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship direction invalid");
    });

    test("should throw type required", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship type required");
    });

    test("should throw type not a string", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: "INVALID" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship type not a string");
    });

    test("should return the correct meta with direction and type", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                    ],
                },
            ],
        };

        const result = getRelationshipMeta(field);

        expect(result).toMatchObject({
            type: "ACTED_IN",
            direction: "IN",
        });
    });

    test("should throw properties not a string", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "properties" },
                            // @ts-ignore
                            value: { kind: Kind.BOOLEAN },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship properties not a string");
    });

    test("should return the correct meta with direction, type and properties", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "properties" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ActedIn" },
                        },
                    ],
                },
            ],
        };

        const result = getRelationshipMeta(field);

        expect(result).toMatchObject({
            type: "ACTED_IN",
            direction: "IN",
            properties: "ActedIn",
        });
    });

    test("should throw queryDirection not an enum", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "queryDirection" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "IN" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship queryDirection not an enum");
    });

    test("should return the correct meta with direction, type and queryDirection", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "queryDirection" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "DEFAULT_UNDIRECTED" },
                        },
                    ],
                },
            ],
        };

        const result = getRelationshipMeta(field);

        expect(result).toMatchObject({
            type: "ACTED_IN",
            direction: "IN",
            queryDirection: "DEFAULT_UNDIRECTED",
        });
    });

    test("should throw nestedOperations not a list", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "IN" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship nestedOperations not a list");
    });

    test("should throw nestedOperations value at index position 0 not an enum", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
                            // @ts-ignore
                            value: {
                                kind: Kind.LIST,
                                values: [
                                    {
                                        kind: Kind.STRING,
                                        value: "FAIL",
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow(
            "@relationship nestedOperations value at index position 0 not an enum"
        );
    });

    test("should throw nestedOperations value at index position 0 invalid", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
                            // @ts-ignore
                            value: {
                                kind: Kind.LIST,
                                values: [
                                    {
                                        kind: Kind.ENUM,
                                        value: "FAIL",
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow(
            "@relationship nestedOperations value at index position 0 invalid"
        );
    });

    test("should throw nestedOperations value at index position 1 invalid", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
                            // @ts-ignore
                            value: {
                                kind: Kind.LIST,
                                values: [
                                    {
                                        kind: Kind.ENUM,
                                        value: "CONNECT",
                                    },
                                    {
                                        kind: Kind.ENUM,
                                        value: "FAIL",
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrow(
            "@relationship nestedOperations value at index position 1 invalid"
        );
    });

    test("should return the correct meta with direction, type and nestedOperations", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
                            // @ts-ignore
                            value: {
                                kind: Kind.LIST,
                                values: [
                                    {
                                        kind: Kind.ENUM,
                                        value: "CONNECT",
                                    },
                                    {
                                        kind: Kind.ENUM,
                                        value: "CREATE",
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        const result = getRelationshipMeta(field);

        expect(result).toMatchObject({
            type: "ACTED_IN",
            direction: "IN",
            nestedOperations: ["CONNECT", "CREATE"],
        });
    });

    test("should return the correct meta for all possible arguments", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "relationship",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "properties" },
                            // @ts-ignore
                            value: { kind: Kind.STRING, value: "ActedIn" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "queryDirection" },
                            // @ts-ignore
                            value: { kind: Kind.ENUM, value: "DEFAULT_UNDIRECTED" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
                            // @ts-ignore
                            value: {
                                kind: Kind.LIST,
                                values: [
                                    {
                                        kind: Kind.ENUM,
                                        value: "CONNECT",
                                    },
                                    {
                                        kind: Kind.ENUM,
                                        value: "CREATE",
                                    },
                                ],
                            },
                        },
                    ],
                },
            ],
        };

        const result = getRelationshipMeta(field);

        expect(result).toMatchObject({
            type: "ACTED_IN",
            direction: "IN",
            properties: "ActedIn",
            queryDirection: "DEFAULT_UNDIRECTED",
            nestedOperations: ["CONNECT", "CREATE"],
        });
    });
});
