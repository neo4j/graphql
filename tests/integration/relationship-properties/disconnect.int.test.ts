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

describe("Relationship properties - disconnect", () => {
    let testHelper: TestHelper;
    let Movie: UniqueType;
    let Actor: UniqueType;
    let Show: UniqueType;

    beforeEach(() => {
        testHelper = new TestHelper();
        Show = testHelper.createUniqueType("Show");
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should disconnect a relationship that has properties", async () => {
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
        const actorName1 = generate({ charset: "alphabetic" });
        const actorName2 = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = /* GraphQL */ `
            mutation ($movieTitle: String!, $actorName1: String!) {
                ${Movie.operations.update}(
                    where: { title: $movieTitle }
                    disconnect: { actors: { where: { node: { name: $actorName1 } } } }
                ) {
                    ${Movie.plural} {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (m:${Movie} {title:$movieTitle})
                    CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:${Actor} {name:$actorName1})
                    CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:${Actor} {name:$actorName2})
                `,
            { movieTitle, screenTime, actorName1, actorName2 }
        );
        const gqlResult = await testHelper.executeGraphQL(source, { variableValues: { movieTitle, actorName1 } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.operations.update][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actors: [{ name: actorName2 }],
            },
        ]);

        const neo4jResult = await testHelper.executeCypher(
            `
            MATCH (:${Movie} {title: $movieTitle})<-[actedIn:ACTED_IN {screenTime: $screenTime}]-(:${Actor} {name: $actorName1})
            RETURN actedIn
            `,
            { movieTitle, screenTime, actorName1 }
        );
        expect(neo4jResult.records).toHaveLength(0);
    });

    test("should disconnect a relationship that has properties (with Union)", async () => {
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
        const movieTitle = generate({ charset: "alphabetic" });
        const actorName = generate({ charset: "alphabetic" });
        const screenTime = Math.floor((Math.random() * 1e3) / Math.random());

        const source = /* GraphQL */ `
            mutation ($screenTime: Int!, $actorName: String!) {
                ${Actor.operations.update}(
                    where: { name: $actorName }
                    disconnect: { actedIn: { ${Movie}: { where: { edge: { screenTime: $screenTime } } } } }
                ) {
                    ${Actor.plural} {
                        name
                        actedIn {
                            __typename
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {title:$movieTitle})<-[:ACTED_IN {screenTime:$screenTime}]-(:${Actor} {name:$actorName})
            `,
            { movieTitle, screenTime, actorName }
        );

        const gqlResult = await testHelper.executeGraphQL(source, { variableValues: { actorName, screenTime } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Actor.operations.update][Actor.plural]).toEqual([
            {
                name: actorName,
                actedIn: [],
            },
        ]);
        const neo4jResult = await testHelper.executeCypher(
            `
                MATCH (:${Actor} {name: $actorName})-[actedIn:ACTED_IN {screenTime: $screenTime}]->(:${Movie} {title: $movieTitle})
                RETURN actedIn
            `,
            { movieTitle, screenTime, actorName }
        );
        expect(neo4jResult.records).toHaveLength(0);
    });
});
