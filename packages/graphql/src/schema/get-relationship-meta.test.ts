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

import { FieldDefinitionNode } from "graphql";
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

    test("should throw direction required", () => {
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
                            value: { kind: "NOT A STRING!" },
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
                            value: { kind: "EnumValue", value: "INVALID!" },
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
                            value: { kind: "EnumValue", value: "IN" },
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
                            value: { kind: "EnumValue", value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: "INVALID" },
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
        };

        expect(() => getRelationshipMeta(field)).toThrow("@relationship type not a string");
    });

    test("should return the correct meta", () => {
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
                            value: { kind: "EnumValue", value: "IN" },
                        },
                        {
                            // @ts-ignore
                            name: { value: "type" },
                            // @ts-ignore
                            value: { kind: "StringValue", value: "ACTED_IN" },
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
        };

        const result = getRelationshipMeta(field);

        expect(result).toMatchObject({
            type: "ACTED_IN",
            direction: "IN",
        });
    });
});
