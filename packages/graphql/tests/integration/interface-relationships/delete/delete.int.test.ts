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
import faker from "faker";
import { gql } from "apollo-server";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("interface relationships", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = gql`
            interface Production {
                title: String!
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should delete delete using interface relationship fields", async () => {
        const session = driver.session();

        const actorName = faker.random.word();

        const movieTitle = faker.random.word();
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const seriesTitle = faker.random.word();
        const seriesEpisodes = faker.random.number();
        const seriesScreenTime = faker.random.number();

        const query = `
            mutation DeleteActorAndMovie($name: String, $title: String) {
                deleteActors(where: { name: $name }, delete: { actedIn: { where: { node: { title: $title } } } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle, episodes: $seriesEpisodes })
            `,
                {
                    actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesEpisodes,
                    seriesScreenTime,
                }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { bookmarks: session.lastBookmark() },
                },
                variableValues: { name: actorName, title: movieTitle },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                deleteActors: {
                    nodesDeleted: 2,
                    relationshipsDeleted: 2,
                },
            });
        } finally {
            await session.close();
        }
    });
});
