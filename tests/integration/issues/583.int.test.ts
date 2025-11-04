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

describe("https://github.com/neo4j/graphql/issues/583", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Movie: UniqueType;
    let ShortFilm: UniqueType;

    let actor: { id: string; name: string; awardsGiven: number };
    let series: { title: string; awardsGiven: number };
    let movie: { title: string; awardsGiven: number };
    let shortFilm: { title: string };

    beforeAll(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Series = testHelper.createUniqueType("Series");
        Movie = testHelper.createUniqueType("Movie");
        ShortFilm = testHelper.createUniqueType("ShortFilm");
        actor = {
            id: generate(),
            name: "aaa",
            awardsGiven: 0,
        };

        series = {
            title: "stranger who",
            awardsGiven: 2,
        };

        movie = {
            title: "doctor things",
            awardsGiven: 42,
        };

        shortFilm = {
            title: "all too well",
        };

        typeDefs = `
            interface Show {
                title: String
            }

            interface Awardable {
                awardsGiven: Int!
            }

            type ${Actor} implements Awardable {
                id: ID!
                name: String
                awardsGiven: Int!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Movie} implements Show & Awardable {
                title: String
                awardsGiven: Int!
            }

            type ${Series} implements Show & Awardable {
                title: String
                awardsGiven: Int!
            }

            type ${ShortFilm} implements Show {
                title: String
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        const testLabel = testHelper.createUniqueType("Test");

        await testHelper.executeCypher(
            `
            CREATE (actor:${Actor}:${testLabel})
            SET actor = $actor
            CREATE (actor)-[:ACTED_IN]->(series:${Series}:${testLabel})
            SET series = $series
            CREATE (actor)-[:ACTED_IN]->(movie:${Movie}:${testLabel})
            SET movie = $movie
            CREATE (actor)-[:ACTED_IN]->(shortFilm:${ShortFilm}:${testLabel})
            SET shortFilm = $shortFilm
          `,
            {
                actor,
                series,
                movie,
                shortFilm,
            }
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should project all interfaces of node", async () => {
        const query = /* GraphQL */ `
            query ($actorId: ID!) {
                ${Actor.plural}(where: { id: $actorId }) {
                    id
                    name
                    actedIn {
                        title
                        ... on Awardable {
                            awardsGiven
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { actorId: actor.id },
        });

        expect(gqlResult.errors).toBeFalsy();

        const gqlActors: Array<{ id: string; name: string; actedIn: { title: string; awardsGiven?: number } }> = (
            gqlResult?.data as any
        )[Actor.plural];
        expect(gqlActors[0]).toBeDefined();
        expect(gqlActors[0]?.actedIn).toContainEqual(movie);
        expect(gqlActors[0]?.actedIn).toContainEqual(series);
        expect(gqlActors[0]?.actedIn).toContainEqual(shortFilm);
    });
});
