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

    test("should throw when relationship has no arguments", () => {
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

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"type\\" of required type \\"String!\\" was not provided."`
        );
    });

    test("should throw when direction is missing", () => {
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

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"direction\\" of required type \\"RelationshipDirection!\\" was not provided."`
        );
    });

    test("should throw when direction not a string", () => {
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

                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            value: { kind: Kind.BOOLEAN, value: true },
                        },
                    ],
                },
            ],
        };
        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"direction\\" has invalid value true."`
        );
    });

    test("should throw when direction is invalid", () => {
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
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "direction" },
                            value: { kind: Kind.ENUM, value: "INVALID!" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"direction\\" has invalid value INVALID!."`
        );
    });

    test("should throw when type is missing", () => {
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"type\\" of required type \\"String!\\" was not provided."`
        );
    });

    test("should throw when type not a string", () => {
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
                            value: { kind: Kind.FLOAT, value: "1.3" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"type\\" has invalid value 1.3."`
        );
    });

    test("should return the correct meta with direction and escaped type", () => {
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
                            value: { kind: Kind.STRING, value: "ACTED_IN$" },
                        },
                    ],
                },
            ],
        };

        const result = getRelationshipMeta(field);

        expect(result).toMatchObject({
            type: "`ACTED_IN$`",
            direction: "IN",
            typeUnescaped: "ACTED_IN$",
        });
    });

    test("should throw when properties is not a string", () => {
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "properties" },
                            value: { kind: Kind.BOOLEAN, value: true },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"properties\\" has invalid value true."`
        );
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "properties" },
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

    test("should throw when queryDirection is not an enum", () => {
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "queryDirection" },
                            value: { kind: Kind.STRING, value: "IN" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"queryDirection\\" has invalid value \\"IN\\"."`
        );
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "queryDirection" },
                            value: { kind: Kind.ENUM, value: "UNDIRECTED" },
                        },
                    ],
                },
            ],
        };

        const result = getRelationshipMeta(field);

        expect(result).toMatchObject({
            type: "ACTED_IN",
            direction: "IN",
            queryDirection: "UNDIRECTED",
        });
    });

    test("should throw when nestedOperations is not a list", () => {
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
                            value: { kind: Kind.STRING, value: "IN" },
                        },
                    ],
                },
            ],
        };

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"nestedOperations\\" has invalid value \\"IN\\"."`
        );
    });

    test("should throw when nestedOperations is invalid", () => {
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
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

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"nestedOperations\\" has invalid value [\\"FAIL\\"]."`
        );
    });

    test("should throw when nestedOperations value at index position 1 is invalid", () => {
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
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

        expect(() => getRelationshipMeta(field)).toThrowErrorMatchingInlineSnapshot(
            `"Argument \\"nestedOperations\\" has invalid value [CONNECT, FAIL]."`
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
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
                            value: { kind: Kind.ENUM, value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            value: { kind: Kind.STRING, value: "ACTED_IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "properties" },
                            value: { kind: Kind.STRING, value: "ActedIn" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "queryDirection" },
                            value: { kind: Kind.ENUM, value: "UNDIRECTED" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "nestedOperations" },
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
            queryDirection: "UNDIRECTED",
            nestedOperations: ["CONNECT", "CREATE"],
        });
    });
});
