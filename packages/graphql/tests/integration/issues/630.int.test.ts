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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/630", () => {
    const testLabel = generate({ charset: "alphabetic" });
    const typeMovie = new UniqueType("Movie");
    const typeActor = new UniqueType("Actor");
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query nested connection", async () => {
        const typeDefs = `
        type ${typeActor} {
            id: ID!
            name: String!
            movies: [${typeMovie}!]! @cypher(statement: "MATCH (this)-[:ACTED_IN]->(m:${typeMovie}) RETURN m")
        }

        type ${typeMovie} {
            id: ID!
            title: String!
            actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
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

        const session = await neo4j.getSession();
        try {
            await session.run(
                `
            CREATE (movie:${typeMovie}:${testLabel}) SET movie = $movie
            CREATE (actor1:${typeActor}:${testLabel}) SET actor1 = $actors[0]
            CREATE (actor2:${typeActor}:${testLabel}) SET actor2 = $actors[1]
            MERGE (actor1)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actor2)
        `,
                { actors, movie },
            );

            const source = `
            query($actorId: ID!) {
                ${typeActor.plural}(where: { id: $actorId }) {
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
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: { actorId: actors[0].id },
            });

            expect(gqlResult.errors).toBeUndefined();

            const gqlActor = (gqlResult.data as any)[typeActor.plural][0];

            expect(gqlActor).toBeDefined();
            expect(gqlActor).toEqual({
                ...actors[0],
                movies: [
                    {
                        ...movie,
                        actorsConnection: {
                            totalCount: 2,
                            edges: expect.toIncludeSameMembers([
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
