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
import getCypherMeta from "./get-cypher-meta";

describe("getCypherMeta", () => {
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

        const result = getCypherMeta(field);

        expect(result).toBeUndefined();
    });

    test("should throw statement required", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: { value: "cypher", arguments: [] },
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

        expect(() => getCypherMeta(field)).toThrow("@cypher statement required");
    });

    test("should throw statement not a string", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "cypher",
                        // @ts-ignore
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "statement" },
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

        expect(() => getCypherMeta(field)).toThrow("@cypher statement not a string");
    });

    test("should return the correct meta", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "cypher",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "statement" },
                            // @ts-ignore
                            value: { kind: "StringValue", value: "MATCH (m:Movie) RETURN m" },
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

        const result = getCypherMeta(field);

        expect(result).toMatchObject({
            statement: "MATCH (m:Movie) RETURN m",
        });
    });
});
