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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("@declareRelationship relationship with different properties per implementation", () => {
    let Person: UniqueType;
    let Movie: UniqueType;
    let Series: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        Person = testHelper.createUniqueType("Person");
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");

        const typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                actors: [${Person}!]! @declareRelationship
            }

            type ${Movie} implements Production @node {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", properties: "ActedInMovie", direction: IN)
            }

            type ${Series} implements Production @node {
                title: String!
                episodes: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", properties: "ActedInSeries", direction: IN)
            }

            type ActedInMovie @relationshipProperties {
                role: String
            }

            type ActedInSeries @relationshipProperties {
                role: String
                episodes: Int
            }

            type ${Person} @node {
                name: String!
                born: Int!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should update edges with different roles", async () => {
        await testHelper.executeCypher(`
            CREATE (p:${Person} {name: "Bob", born: 1956})
            CREATE (m:${Movie} {title: "A", released: 2003})
            CREATE (m2:${Movie} {title: "B", released: 2003})
            MERGE (p)-[:ACTED_IN]->(m)
            MERGE (p)-[:ACTED_IN]->(m2)

        `);
        const query = /* GraphQL */ `
            mutation {
                ${Person.operations.update}(
                    where: { name: { eq: "Bob" } }
                    update: {
                        actedIn: [
                            {
                                update: {
                                    where: { node: { title: { eq: "B" } } }
                                    node: { actors: [{ update: { edge: { ActedInMovie: { role: { set: "abc" } } } } }] }
                                }
                            }
                            {
                                update: {
                                    where: { node: { title: { eq: "A" } } }
                                    node: { actors: [{ update: { edge: { ActedInMovie: { role: { set: "def" } } } } }] }
                                }
                            }
                        ]
                    }
                ) {
                    ${Person.plural} {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [Person.operations.update]: {
                [Person.plural]: [
                    {
                        name: "Bob",
                    },
                ],
            },
        });

        await testHelper.expectRelationship(Person, Movie, "ACTED_IN").toIncludeSameMembers([
            {
                from: {
                    name: "Bob",
                    born: 1956,
                },
                to: {
                    title: "A",
                    released: 2003,
                },
                relationship: {
                    role: "def",
                },
            },
            {
                from: {
                    name: "Bob",
                    born: 1956,
                },
                to: {
                    title: "B",
                    released: 2003,
                },
                relationship: {
                    role: "abc",
                },
            },
        ]);
    });
});
