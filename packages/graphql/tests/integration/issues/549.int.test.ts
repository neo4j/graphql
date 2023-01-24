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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/549", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw when creating a node without a mandatory relationship", async () => {
        const session = await neo4j.getSession();

        const testPerson = generateUniqueType("Person");
        const testMovie = generateUniqueType("Movie");

        const typeDefs = gql`
            type ${testPerson.name} {
                name: String!
                born: Int!
                actedInMovies: [${testMovie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                directedMovies: [${testMovie.name}!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type ${testMovie.name} {
                title: String!
                released: Int!
                actors: [${testPerson.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                director: ${testPerson.name}! @relationship(type: "DIRECTED", direction: IN)
            }

            interface ActedIn @relationshipProperties {
                roles: [String!]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            mutation {
                ${testMovie.operations.create}(input: [{title: "Test", released: 2022}]) {
                  ${testMovie.plural} {
                    title
                  }
                }
            }
        `;

        try {
            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeTruthy();
            expect((result.errors as any[])[0].message).toBe(`${testMovie.name}.director required exactly once`);
        } finally {
            await session.close();
        }
    });
});
