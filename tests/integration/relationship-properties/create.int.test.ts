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
import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Relationship properties - create", () => {
    let testHelper: TestHelper;
    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(() => {
        testHelper = new TestHelper();
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a node with a relationship that has properties", async () => {
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
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = /* GraphQL */ `
            mutation ($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: $movieTitle
                            actors: { create: [{ edge: { screenTime: $screenTime }, node: { name: $actorName } }] }
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

        const result = await testHelper.executeGraphQL(source, {
            variableValues: { movieTitle, actorName, screenTime },
        });
        expect(result.errors).toBeFalsy();
        expect((result.data as any)[Movie.operations.create][Movie.plural]).toEqual([
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

    test("should create a node with a relationship that has properties(with Union)", async () => {
        const typeDefs = gql`
            union Publication = ${Movie}

            type ${Movie} {
                title: String!
            }

            type ${Actor} {
                name: String!
                publications: [Publication!]! @relationship(type: "WROTE", properties: "Wrote", direction: OUT)
            }

            type Wrote @relationshipProperties {
                words: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const words = Math.floor((Math.random() * 1e3) / Math.random());

        const source = /* GraphQL */ `
            mutation ($actorName: String!, $words: Int!, $movieTitle: String!) {
                ${Actor.operations.create}(
                    input: [
                        {
                            name: $actorName
                            publications: {
                                ${Movie}: { create: [{ edge: { words: $words }, node: { title: $movieTitle } }] }
                            }
                        }
                    ]
                ) {
                    ${Actor.plural} {
                        name
                        publications {
                            ... on ${Movie} {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(source, {
            variableValues: { actorName, words, movieTitle },
        });
        expect(result.errors).toBeFalsy();
        expect((result.data as any)[Actor.operations.create][Actor.plural]).toEqual([
            {
                name: actorName,
                publications: [{ title: movieTitle }],
            },
        ]);

        const cypher = `
            MATCH (a:${Actor} {name: $actorName})-[:WROTE {words: $words}]->(:${Movie} {title: $movieTitle})
            RETURN a
        `;

        const neo4jResult = await testHelper.executeCypher(cypher, { movieTitle, words, actorName });
        expect(neo4jResult.records).toHaveLength(1);
    });
});
