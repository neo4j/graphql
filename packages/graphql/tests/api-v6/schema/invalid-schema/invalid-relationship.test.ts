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

describe("Relationships validation", () => {
    test("should raise if target is invalid, not nullable one to one", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                type Actor @node {
                    name: String
                    movies: Movie! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };

        await expect(fn()).rejects.toEqual([new GraphQLError("@relationship can only be used on List target")]);
    });

    test("should raise if target is invalid, nullable one to one", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                type Actor @node {
                    name: String
                    movies: Movie @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([new GraphQLError("@relationship can only be used on List target")]);
    });

    test("should raise if target is invalid, target is a scalar field", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                type Actor @node {
                    name: String
                    movies: [String]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([new GraphQLError("@relationship cannot be used with type: String")]);
    });

    test("should raise if target is valid, list of nullable target", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                type Actor @node {
                    name: String
                    movies: [Movie]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };

        await expect(fn()).rejects.toEqual([new GraphQLError("Invalid field type: List type relationship fields must be non-nullable and have non-nullable entries, please change type to [Movie!]!")]);
    });

    test("should not raise if target is valid, nullable list type", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                type Actor @node {
                    name: String
                    movies: [Movie!] @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };

        await expect(fn()).toResolve();
    });

    test("should not raise if target is valid, not nullable list type", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                type Actor @node {
                    name: String
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };

        await expect(fn()).toResolve();
    });
});
