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
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/873", () => {
    test("Fails on name conflict in schema generation", async () => {
        const typeDefs = /* GraphQL */ `
            type Tech @node @plural(value: "Techs") {
                name: String
            }

            type AnotherTech @node @plural(value: "Techs") {
                name: String
            }

            type Techs @node {
                value: String
            }
        `;

        await expect(async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
            await neoSchema.getSchema();
        }).rejects.toIncludeSameMembers([
            new GraphQLError(`Ambiguous plural "techs" in "AnotherTech"`),
            new GraphQLError(`Ambiguous plural "techs" in "Techs"`),
        ]);
    });
});
