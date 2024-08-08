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

describe("@id validation", () => {
    test("should not raise for valid @id usage", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    id: ID! @id
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
                type Actor @node {
                    id: ID! @id
                    name: String
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                }

                type ActedIn @relationshipProperties {
                    id: ID! @id
                    year: Int
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };

        await expect(fn()).toResolve();
    });

    test.each([
        { dataType: "String", errorMsg: "Cannot autogenerate a non ID field." },
        { dataType: "Float", errorMsg: "Cannot autogenerate a non ID field." },
        { dataType: "Date", errorMsg: "Cannot autogenerate a non ID field." },
        { dataType: "String!", errorMsg: "Cannot autogenerate a non ID field." },
        { dataType: "[String!]", errorMsg: "Cannot autogenerate an array." },
        { dataType: "[String!]!", errorMsg: "Cannot autogenerate an array." },
        { dataType: "[String]!", errorMsg: "Cannot autogenerate an array." },
    ] as const)("should raise when @id is not defined on $dataType field", async ({ dataType, errorMsg }) => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    id: ID!
                    field: ${dataType} @id
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([new GraphQLError(errorMsg)]);
    });

    test("should raise when @id is not defined on an invalid field on a extension", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    id: ID!
                }
                extend type Movie {
                    field: String @id
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([new GraphQLError("Cannot autogenerate a non ID field.")]);
    });

    test("should raise when @id is not defined on an invalid field on a relationship property", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    id: ID!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
                type Actor @node {
                    id: ID!
                }
                type ActedIn @relationshipProperties {
                    id: ID!
                    field: String @id
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([new GraphQLError("Cannot autogenerate a non ID field.")]);
    });
});
