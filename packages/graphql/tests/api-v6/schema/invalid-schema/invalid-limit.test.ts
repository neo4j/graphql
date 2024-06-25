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

describe("Limit validation", () => {
    test("should not raise for valid @limit usage", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @limit(default: 10, max: 20) @node {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };

        await expect(fn()).toResolve();
    });

    test("should raise for invalid @limit usage, default > max", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @limit(default: 20, max: 10) @node {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([
            new GraphQLError("@limit.max invalid value: 10. Must be greater than limit.default: 20."),
        ]);
    });

    test("should raise for invalid @limit usage, default < 0", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @limit(default: -20, max: 10) @node {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([
            new GraphQLError("@limit.default invalid value: -20. Must be greater than 0."),
        ]);
    });

    test("should raise for invalid @limit usage, max < 0", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @limit(default: 10, max: -20) @node {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([
            new GraphQLError("@limit.max invalid value: -20. Must be greater than 0."),
        ]);
    });

    test("should raise for invalid @limit usage, max float", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @limit(max: 2.3) @node {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual(new Error(`Argument "max" has invalid value 2.3.`));
    });
});
