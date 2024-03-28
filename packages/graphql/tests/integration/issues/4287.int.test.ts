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

describe("https://github.com/neo4j/graphql/issues/4287", () => {
    const testHelper = new TestHelper();

    let Actor: UniqueType;
    let Movie: UniqueType;
    let Series: UniqueType;

    beforeAll(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");

        const typeDefs = /* GraphQL */ `
            type ${Actor} {
                name: String
                actedIn: [Production!]! @relationship(type: "ACTED_IN", properties: "actedIn", direction: OUT)
            }
            type actedIn @relationshipProperties {
                role: String
            }
            interface Production {
                title: String
            }
            type ${Movie} implements Production {
                title: String
                runtime: Int
            }
            type ${Series} implements Production {
                title: String
                episodes: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE (a:${Actor} { name: "Someone" })
            CREATE (a)-[:ACTED_IN]->(:${Movie} {title: "something"})
            CREATE (a)-[:ACTED_IN]->(:${Series} {title: "whatever"})
            CREATE (a)-[:ACTED_IN]->(:${Movie} {title: "whatever 2"})
            CREATE (a)-[:ACTED_IN]->(:${Series} {title: "something 2"})
            `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("filter by logical operator on interface connection", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    actedInConnection(
                        where: { OR: [{ node: { title: "something" } }, { node: { title: "whatever" } }] }
                    ) {
                        edges {
                            node {
                                __typename
                                title
                            }
                        }
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);
        expect(response.errors).toBeFalsy();
        expect(response.data?.[Actor.plural]).toIncludeSameMembers([
            {
                actedInConnection: {
                    edges: [
                        {
                            node: {
                                __typename: Movie.name,
                                title: "something",
                            },
                        },
                        {
                            node: {
                                __typename: Series.name,
                                title: "whatever",
                            },
                        },
                    ],
                },
            },
        ]);
    });
});
