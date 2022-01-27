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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Connections Filtering", () => {
    let driver: Driver;
    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });
    test("should allow where clause on relationship property of node", async () => {
        const movieTitle = generate({ charset: "alphabetic" });
        const actorOneName = generate({ charset: "alphabetic" });
        const actorTwoName = generate({ charset: "alphabetic" });

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;
        const { schema } = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
			query ($movieTitle: String!) {
				movies(where: { title: $movieTitle }) {
					actorsConnection(where: {node: {movies: { title: $movieTitle } } }) {
						edges {
							node {
								name
							}
						}
					}
				}
			}
		`;

        const session = driver.session();
        try {
            await session.run(
                `
					CREATE (movie:Movie {title: $movieTitle})
					CREATE (actorOne:Actor {name: $actorOneName})
					CREATE (actorTwo:Actor {name: $actorTwoName})
					CREATE (actorOne)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actorTwo)
                `,
                {
                    movieTitle,
                    actorOneName,
                    actorTwoName,
                }
            );
            const result = await graphql({
                schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: {
                    movieTitle,
                },
            });
            expect(result.errors).toBeFalsy();
            expect((result?.data as any)?.movies[0].actorsConnection.edges).toContainEqual({
                node: { name: actorOneName },
            });
            expect((result?.data as any)?.movies[0].actorsConnection.edges).toContainEqual({
                node: { name: actorTwoName },
            });
        } finally {
            await session.close();
        }
    });
});
