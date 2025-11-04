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

describe("Relationship properties - connect on union", () => {
    let Movie: UniqueType;
    let Actor: UniqueType;
    let Show: UniqueType;
    let testHelper: TestHelper;

    beforeAll(async () => {
        testHelper = new TestHelper();
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Show = testHelper.createUniqueType("Show");

        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                title: String!
            }

            type ${Show} {
                name: String!
            }

            type ${Actor} {
                name: String!
                actedIn: [ActedInUnion!]!
                    @relationship(type: "ACTED_IN", properties: "ActedInInterface", direction: OUT)
            }

            union ActedInUnion = ${Movie} | ${Show}

            type ActedInInterface @relationshipProperties {
                screenTime: Int!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create an actor while connecting a relationship that has properties", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = /* GraphQL */ `
            mutation ($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${Actor.operations.create}(
                    input: [
                        {
                            name: $actorName
                            actedIn: {
                                ${Movie}: {
                                    connect: {
                                        where: { node: { title: $movieTitle } }
                                        edge: { screenTime: $screenTime }
                                    }
                                }
                            }
                        }
                    ]
                ) {
                    ${Actor.plural} {
                        name
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {title:$movieTitle})
                `,
            { movieTitle }
        );

        const gqlResult = await testHelper.executeGraphQL(source, {
            variableValues: { movieTitle, actorName, screenTime },
        });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Actor.operations.create][Actor.plural]).toEqual([
            {
                name: actorName,
            },
        ]);

        const neo4jResult = await testHelper.executeCypher(
            `
                MATCH (a:${Actor} {name: $actorName})-[:ACTED_IN {screenTime: $screenTime}]->(:${Movie} {title: $movieTitle})
                RETURN a
            `,
            { movieTitle, screenTime, actorName }
        );
        expect(neo4jResult.records).toHaveLength(1);
    });

    test("should update an actor while connecting a relationship that has properties(with Union)", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = /* GraphQL */ `
            mutation($movieTitle: String!, $screenTime: Int!, $actorName: String!) {
                ${Actor.operations.update}(
                    where: { name: $actorName }
                    connect: {
                        actedIn: {
                            ${Movie}: {
                                where: { node: { title: $movieTitle } }
                                edge: { screenTime: $screenTime }
                            }
                        }
                    }
                ) {
                    ${Actor.plural} {
                        name
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
            variableValues: { movieTitle, actorName, screenTime },
        });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Actor.operations.update][Actor.plural]).toEqual([
            {
                name: actorName,
            },
        ]);

        const cypher = `
                MATCH (a:${Actor} {name: $actorName})-[:ACTED_IN {screenTime: $screenTime}]->(:${Movie} {title: $movieTitle})
                RETURN a
            `;

        const neo4jResult = await testHelper.executeCypher(cypher, { movieTitle, screenTime, actorName });
        expect(neo4jResult.records).toHaveLength(1);
    });
});
