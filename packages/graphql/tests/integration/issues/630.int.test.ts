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

import { graphql } from "graphql";
import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";

const testLabel = generate({ charset: "alphabetic" });
describe("https://github.com/neo4j/graphql/issues/630", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query nested connection", async () => {
        const typeDefs = `
        type Actor {
            id: ID!
            name: String!
            movies: [Movie!]! @cypher(statement: "MATCH (this)-[:ACTED_IN]->(m:Movie) RETURN m")
        }

        type Movie {
            id: ID!
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const schema = await neoSchema.getSchema();

        const actors = [
            {
                id: generate(),
                name: "Keanu Reeves",
            },
            {
                id: generate(),
                name: "Carrie-Ann Moss",
            },
        ];

        const movie = {
            id: generate(),
            title: "The Matrix",
        };

        const session = driver.session();
        try {
            await session.run(
                `
            CREATE (movie:Movie:${testLabel}) SET movie = $movie
            CREATE (actor1:Actor:${testLabel}) SET actor1 = $actors[0]
            CREATE (actor2:Actor:${testLabel}) SET actor2 = $actors[1]
            MERGE (actor1)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actor2)
        `,
                { actors, movie }
            );

            const source = `
            query($actorId: ID!) {
                actors(where: { id: $actorId }) {
                    id
                    name
                    movies {
                        id
                        title
                        actorsConnection {
                            totalCount
                            edges {
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

            const gqlResult = await graphql({
                schema,
                source,
                contextValue: { driver },
                variableValues: { actorId: actors[0].id },
            });

            expect(gqlResult.errors).toBeUndefined();

            const gqlActor = (gqlResult.data as any)?.actors[0];

            expect(gqlActor).toBeDefined();
            expect(gqlActor).toEqual({
                ...actors[0],
                movies: [
                    {
                        ...movie,
                        actorsConnection: {
                            totalCount: 2,
                            edges: expect.arrayContaining([
                                {
                                    node: actors[0],
                                },
                                {
                                    node: actors[1],
                                },
                            ]),
                        },
                    },
                ],
            });
        } finally {
            await session.run(`MATCH (node:${testLabel}) DETACH DELETE node`);
            await session.close();
        }
    });
});
