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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive in relationship properties with unions", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;
    let Director: UniqueType;
    let Series: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Director = testHelper.createUniqueType("Director");
        Series = testHelper.createUniqueType("Series");

        const typeDefs = /* GraphQL */ `
            union Production = ${Movie} | ${Series}

            type ${Movie} @node {
                title: String!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} @node {
                title: String!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            union Person = ${Actor} | ${Director}

            type ${Actor} @node {
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ${Director} @node {
                name: String!
            }

            type ActedIn @relationshipProperties {
                screenTimeHours: Float
                    @cypher(
                        statement: """
                        RETURN this.screenTimeMinutes / 60 AS c
                        """
                        columnName: "c"
                    )
                screenTimeMinutes: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("custom properties on a union relationship", async () => {
        const source = /* GraphQL */ `
            query {
                 ${Movie.plural} {
                    title
                    actorsConnection {
                        edges {
                            properties {
                                ... on ActedIn {
                                    screenTimeHours
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(:${Movie} {title: "The Matrix"})<-[:ACTED_IN {screenTimeMinutes: 120}]-(:${Actor} {name: "Keanu"})`
        );

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actorsConnection: {
                        edges: [
                            {
                                properties: {
                                    screenTimeHours: 2.0,
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
