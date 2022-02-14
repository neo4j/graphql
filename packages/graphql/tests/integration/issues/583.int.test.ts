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

import gql from "graphql-tag";
import { graphql, GraphQLSchema } from "graphql";
import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import neo4j from "../neo4j";

const testLabel = generate({ charset: "alphabetic" });

describe("583", () => {
    let driver: Driver;
    let schema: GraphQLSchema;

    const typeDefs = gql`
        interface Show {
            title: String
        }

        interface Awardable {
            awardsGiven: Int!
        }

        type Actor implements Awardable {
            id: ID!
            name: String
            awardsGiven: Int!
            actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT)
        }

        type Movie implements Show & Awardable {
            title: String
            awardsGiven: Int!
        }

        type Series implements Show & Awardable {
            title: String
            awardsGiven: Int!
        }

        type ShortFilm implements Show {
            title: String
        }
    `;

    const actor = {
        id: generate(),
        name: "aaa",
        awardsGiven: 0,
    };

    const series = {
        title: "stranger who",
        awardsGiven: 2,
    };

    const movie = {
        title: "doctor things",
        awardsGiven: 42,
    };

    const shortFilm = {
        title: "all too well",
    };

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        schema = await neoSchema.getSchema();

        await session.run(
            `
            CREATE (actor:Actor:${testLabel})
            SET actor = $actor
            CREATE (actor)-[:ACTED_IN]->(series:Series:${testLabel})
            SET series = $series
            CREATE (actor)-[:ACTED_IN]->(movie:Movie:${testLabel})
            SET movie = $movie
            CREATE (actor)-[:ACTED_IN]->(shortFilm:ShortFilm:${testLabel})
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
        const session = driver.session();

        await session.run(`MATCH (node:${testLabel}) DETACH DELETE node`);
        await session.close();

        await driver.close();
    });

    test("should project all interfaces of node", async () => {
        const query = gql`
            query ($actorId: ID!) {
                actors(where: { id: $actorId }) {
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
            source: query.loc!.source,
            variableValues: { actorId: actor.id },
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeFalsy();

        const gqlActors: Array<{ id: string; name: string; actedIn: { title: string; awardsGiven?: number } }> = (
            gqlResult?.data as any
        )?.actors;
        expect(gqlActors[0]).toBeDefined();
        expect(gqlActors[0].actedIn).toContainEqual(movie);
        expect(gqlActors[0].actedIn).toContainEqual(series);
        expect(gqlActors[0].actedIn).toContainEqual(shortFilm);
    });
});
