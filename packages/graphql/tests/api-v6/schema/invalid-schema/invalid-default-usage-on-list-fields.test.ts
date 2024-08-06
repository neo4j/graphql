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

import { GraphQLError } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { raiseOnInvalidSchema } from "../../../utils/raise-on-invalid-schema";

describe("invalid @default usage on List fields", () => {
    test("@default should fail without define a value", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type User @node {
                    name: [String] @default
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([
            new GraphQLError(
                'Directive "@default" argument "value" of type "ScalarOrEnum!" is required, but it was not provided.'
            ),
        ]);
    });

    test.each([
        {
            dataType: "[ID]",
            value: [1.2],
            errorMsg: "@default.value on ID list fields must be a list of ID values",
        },
        {
            dataType: "[String]",
            value: [1.2],
            errorMsg: "@default.value on String list fields must be a list of String values",
        },
        {
            dataType: "[Boolean]",
            value: [1.2],
            errorMsg: "@default.value on Boolean list fields must be a list of Boolean values",
        },
        { dataType: "[Int]", value: 1.2, errorMsg: "@default.value on Int list fields must be a list of Int values" },
        {
            dataType: "[Float]",
            value: ["stuff"],
            errorMsg: "@default.value on Float list fields must be a list of Float values",
        },
        {
            dataType: "[DateTime]",
            value: ["dummy"],
            errorMsg: "@default.value on DateTime list fields must be a list of DateTime values",
        },
    ] as const)(
        "@default should fail with an invalid $dataType value",
        async ({ dataType, value: value, errorMsg }) => {
            const stringValue = typeof value === "string" ? `"${value}"` : value;
            const fn = async () => {
                const typeDefs = /* GraphQL */ `
                    type User @node {
                        name: ${dataType} @default(value: ${stringValue})
                    }
                    extend type User {
                        anotherField: ${dataType} @default(value: ${stringValue})
                    }
                `;
                const neoSchema = new Neo4jGraphQL({ typeDefs });
                const schema = await neoSchema.getAuraSchema();
                raiseOnInvalidSchema(schema);
            };

            await expect(fn()).rejects.toEqual([new GraphQLError(errorMsg), new GraphQLError(errorMsg)]);
        }
    );

    test.each([
        {
            dataType: "[ID]",
            value: ["some-unique-id", "another-unique-id"],
        },
        {
            dataType: "[String]",
            value: ["dummyValue", "anotherDummyValue"],
        },
        {
            dataType: "[Boolean]",
            value: [false, true],
        },
        { dataType: "[Int]", value: [1, 3] },
        { dataType: "[Float]", value: [1.2, 1.3] },
        { dataType: "[DateTime]", value: ["2021-01-01T00:00:00", "2022-01-01T00:00:00"] },
    ] as const)("@default should not fail with a valid $dataType value", async ({ dataType, value }) => {
        const fn = async () => {
            const stringValue = value.map((v) => (typeof v === "string" ? `"${v}"` : v)).join(", ");
            const typeDefs = /* GraphQL */ `
                type User @node {
                    name: ${dataType} @default(value: [${stringValue}])
                }
                extend type User {
                    anotherField: ${dataType} @default(value: [${stringValue}])
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).resolves.not.toThrow();
    });

    test.todo("add tests for LocalDateTime, Date, Time, LocalTime, Duration when supported");
    test.todo("@default with custom enum");
    test.todo("@default with user defined scalar");
});
