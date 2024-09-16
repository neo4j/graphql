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

import { gql } from "graphql-tag";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/549", () => {
    const testHelper = new TestHelper();

    beforeAll(() => {});

    afterAll(async () => {
        await testHelper.close();
    });

    test("should throw when creating a node without a mandatory relationship", async () => {
        const testPerson = testHelper.createUniqueType("Person");
        const testMovie = testHelper.createUniqueType("Movie");

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

            type ActedIn @relationshipProperties {
                roles: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            mutation {
                ${testMovie.operations.create}(input: [{title: "Test", released: 2022}]) {
                  ${testMovie.plural} {
                    title
                  }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeTruthy();
        expect((result.errors as any[])[0].message).toBe(`${testMovie.name}.director required exactly once`);
    });
});
