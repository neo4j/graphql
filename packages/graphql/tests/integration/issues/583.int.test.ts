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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { getQuerySource } from "../../utils/get-query-source";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("583", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let schema: GraphQLSchema;
    let typeDefs: string;
    let Series: UniqueType;
    let Actor: UniqueType;
    let Movie: UniqueType;
    let ShortFilm: UniqueType;
    let testLabel: string;

    let actor: { id: string; name: string; awardsGiven: number };
    let series: { title: string; awardsGiven: number };
    let movie: { title: string; awardsGiven: number };
    let shortFilm: { title: string };

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        const session = await neo4j.getSession();

        Actor = new UniqueType("Actor");
        Series = new UniqueType("Series");
        Movie = new UniqueType("Movie");
        ShortFilm = new UniqueType("ShortFilm");
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
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        schema = await neoSchema.getSchema();

        testLabel = generate({ charset: "alphabetic" });

        await session.run(
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
        await session.close();
    });

    afterAll(async () => {
        const session = await neo4j.getSession();

        await session.run(`MATCH (node:${testLabel}) DETACH DELETE node`);
        await session.close();

        await driver.close();
    });

    test("should project all interfaces of node", async () => {
        const query = gql`
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

        const gqlResult = await graphql({
            schema,
            source: getQuerySource(query),
            variableValues: { actorId: actor.id },
            contextValue: neo4j.getContextValues(),
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
