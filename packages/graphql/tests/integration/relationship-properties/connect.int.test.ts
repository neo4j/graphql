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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Relationship properties - connect", () => {
    let Movie: UniqueType;
    let Actor: UniqueType;
    let testHelper: TestHelper;

    beforeAll(async () => {
        testHelper = new TestHelper();
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Actor} {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create a movie while connecting a relationship that has properties", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = /* GraphQL */ `
            mutation ($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: $movieTitle
                            actors: {
                                connect: [{ where: { node: { name: $actorName } }, edge: { screenTime: $screenTime } }]
                            }
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(`CREATE (:${Actor} {name:$actorName})`, { actorName });
        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { movieTitle, screenTime, actorName },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actorsConnection: { edges: [{ properties: { screenTime }, node: { name: actorName } }] },
            },
        ]);

        const neo4jResult = await testHelper.executeCypher(
            `
                MATCH (m:${Movie} {title: $movieTitle})<-[:ACTED_IN {screenTime: $screenTime}]-(:${Actor} {name: $actorName})
                RETURN m
            `,
            { movieTitle, screenTime, actorName }
        );
        expect(neo4jResult.records).toHaveLength(1);
    });

    test("should update a movie while connecting a relationship that has properties", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = /* GraphQL */ `
            mutation ($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${Movie.operations.update}(
                    where: { title: $movieTitle }
                    connect: { actors: { where: { node: { name: $actorName } }, edge: { screenTime: $screenTime } } }
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title:$movieTitle})
                    CREATE (:${Actor} {name:$actorName})
                `,
            { movieTitle, actorName }
        );

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { movieTitle, screenTime, actorName },
        });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.operations.update][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actorsConnection: { edges: [{ properties: { screenTime }, node: { name: actorName } }] },
            },
        ]);

        const neo4jResult = await testHelper.executeCypher(
            `MATCH (m:${Movie} {title: $movieTitle})<-[:ACTED_IN {screenTime: $screenTime}]-(:${Actor} {name: $actorName}) RETURN m`,
            { movieTitle, screenTime, actorName }
        );
        expect(neo4jResult.records).toHaveLength(1);
    });
});
