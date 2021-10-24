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
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { localEventEmitter } from "../../../src/utils/pubsub";

describe("mutation events (read)", () => {
    let driver: Driver;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = gql`

            type Movie {
                title: String!
                runtime: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read and not emit any events", async () => {
        const session = driver.session();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.random.number();
        const movieScreenTime = faker.random.number();

        const query = `
            query Actors($name: String) {
                actors(where: { name: $name }) {
                    name
                    actedIn {
                        title
                        runtime
                    }
                }
            }
        `;

        const events: any[] = [];
        function onEvent(event: string | symbol, payload) {
            events.push({ event, payload });
        }

        try {
            await session.run(`
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
            `,
                { actorName, movieTitle, movieRuntime, movieScreenTime }
            );

            localEventEmitter.addAnyListener(onEvent);

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                variableValues: { name: actorName },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.actors[0].actedIn).toHaveLength(1);
            expect(gqlResult.data).toEqual({
                actors: [
                    {
                        actedIn: expect.arrayContaining([
                            {
                                runtime: movieRuntime,
                                title: movieTitle,
                            },
                        ]),
                        name: actorName,
                    },
                ],
            });
            expect(events).toHaveLength(0);
        } finally {
            await session.close();
            localEventEmitter.removeAnyListener(onEvent);
        }
    });
});
