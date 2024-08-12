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

describe("List validation", () => {
    test("should not raise for non nullable list of non nullable string", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: [String!]!
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };

        await expect(fn()).toResolve();
    });

    test("should not raise for a list of non nullable string", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: [String!]
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };

        await expect(fn()).toResolve();
    });

    test("should raise when for list of nullable element", async () => {
        const fn = async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: [String]!
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getAuraSchema();
            raiseOnInvalidSchema(schema);
        };
        await expect(fn()).rejects.toEqual([
            new GraphQLError("List of non-null elements are not supported. Found: [String]!"),
        ]);
    });
});
