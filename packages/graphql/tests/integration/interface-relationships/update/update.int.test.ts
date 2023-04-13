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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { faker } from "@faker-js/faker";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("interface relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = gql`
            type Episode {
                runtime: Int!
                series: Series! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production {
                title: String!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
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

    test("update through relationship field", async () => {
        const session = await neo4j.getSession();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.datatype.number();

        const query = `
            mutation UpdateUpdate($name: String, $oldTitle: String, $newTitle: String) {
                updateActors(
                    where: { name: $name }
                    update: {
                        actedIn: { where: { node: { title: $oldTitle } }, update: { node: { title: $newTitle } } }
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            title
                            ... on Movie {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle })
            `,
                {
                    actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesScreenTime,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name: actorName,
                    oldTitle: movieTitle,
                    newTitle: movieNewTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    runtime: movieRuntime,
                                    title: movieNewTitle,
                                },
                                {
                                    title: seriesTitle,
                                },
                            ]),
                            name: actorName,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("nested update through relationship field", async () => {
        const session = await neo4j.getSession();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorNewName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const seriesTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const seriesScreenTime = faker.datatype.number();

        const query = `
            mutation UpdateUpdate($name: String, $newName: String, $oldTitle: String, $newTitle: String) {
                updateActors(
                    where: { name: $name }
                    update: {
                        actedIn: {
                            where: { node: { title: $oldTitle } }
                            update: { node: { title: $newTitle, actors: { update: { node: { name: $newName } } } } }
                        }
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            title
                            ... on Movie {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $seriesTitle })
            `,
                {
                    actorName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesTitle,
                    seriesScreenTime,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name: actorName,
                    newName: actorNewName,
                    oldTitle: movieTitle,
                    newTitle: movieNewTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    runtime: movieRuntime,
                                    title: movieNewTitle,
                                },
                                {
                                    title: seriesTitle,
                                },
                            ]),
                            name: actorNewName,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("nested update through relationship field using _on to only update through certain type", async () => {
        const session = await neo4j.getSession();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorOldName = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorNewName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const seriesScreenTime = faker.datatype.number();

        const query = `
            mutation UpdateUpdate(
                $name: String
                $oldName: String
                $newName: String
                $oldTitle: String
                $newTitle: String
            ) {
                updateActors(
                    where: { name: $name }
                    update: {
                        actedIn: {
                            where: { node: { title: $oldTitle } }
                            update: {
                                node: {
                                    _on: {
                                        Movie: {
                                            title: $newTitle
                                            actors: {
                                                where: { node: { name: $oldName } }
                                                update: { node: { name: $newName } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            __typename
                            title
                            actors {
                                name
                            }
                            ... on Movie {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })<-[:ACTED_IN { screenTime: $movieScreenTime }]-(:Actor { name: $actorOldName })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(s:Series { title: $movieTitle })<-[:ACTED_IN { screenTime: $seriesScreenTime }]-(:Actor { name: $actorOldName })
                CREATE (s)-[:HAS_EPISODE]->(:Episode {runtime: 123})
            `,
                {
                    actorName,
                    actorOldName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesScreenTime,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name: actorName,
                    oldName: actorOldName,
                    newName: actorNewName,
                    oldTitle: movieTitle,
                    newTitle: movieNewTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    __typename: "Movie",
                                    runtime: movieRuntime,
                                    title: movieNewTitle,
                                    actors: expect.toIncludeSameMembers([
                                        {
                                            name: actorName,
                                        },
                                        {
                                            name: actorNewName,
                                        },
                                    ]),
                                },
                                {
                                    __typename: "Series",
                                    title: movieTitle,
                                    actors: expect.toIncludeSameMembers([
                                        {
                                            name: actorName,
                                        },
                                        {
                                            name: actorOldName,
                                        },
                                    ]),
                                },
                            ]),
                            name: actorName,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("nested update through relationship field using where _on to only update certain type", async () => {
        const session = await neo4j.getSession();

        const actorName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const actorOldName = generate({
            readable: true,
            charset: "alphabetic",
        });
        const actorNewName = generate({
            readable: true,
            charset: "alphabetic",
        });

        const movieTitle = generate({
            readable: true,
            charset: "alphabetic",
        });
        const movieRuntime = faker.datatype.number();
        const movieScreenTime = faker.datatype.number();

        const movieNewTitle = generate({
            readable: true,
            charset: "alphabetic",
        });

        const seriesScreenTime = faker.datatype.number();

        const query = `
            mutation UpdateUpdate($name: String, $newName: String, $oldName: String, $oldTitle: String, $newTitle: String) {
                updateActors(
                    where: { name: $name }
                    update: {
                        actedIn: {
                            where: { node: { _on: { Movie: { title: $oldTitle } } } }
                            update: {
                                node: {
                                    title: $newTitle
                                    actors: {
                                        where: { node: { name: $oldName } }
                                        update: { node: { name: $newName } }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    actors {
                        name
                        actedIn {
                            __typename
                            title
                            actors {
                                name
                            }
                            ... on Movie {
                                runtime
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                CREATE (a:Actor { name: $actorName })
                CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:Movie { title: $movieTitle, runtime:$movieRuntime })<-[:ACTED_IN { screenTime: $movieScreenTime }]-(old:Actor { name: $actorOldName })
                CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:Series { title: $movieTitle })<-[:ACTED_IN { screenTime: $seriesScreenTime }]-(old)
            `,
                {
                    actorName,
                    actorOldName,
                    movieTitle,
                    movieRuntime,
                    movieScreenTime,
                    seriesScreenTime,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues: {
                    name: actorName,
                    oldName: actorOldName,
                    newName: actorNewName,
                    oldTitle: movieTitle,
                    newTitle: movieNewTitle,
                },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                updateActors: {
                    actors: [
                        {
                            actedIn: expect.toIncludeSameMembers([
                                {
                                    __typename: "Movie",
                                    actors: expect.toIncludeSameMembers([
                                        {
                                            name: actorName,
                                        },
                                        {
                                            name: actorNewName,
                                        },
                                    ]),
                                    runtime: movieRuntime,
                                    title: movieNewTitle,
                                },
                                {
                                    __typename: "Series",
                                    actors: expect.toIncludeSameMembers([
                                        {
                                            name: actorName,
                                        },
                                        {
                                            name: actorNewName,
                                        },
                                    ]),
                                    title: movieTitle,
                                },
                            ]),
                            name: actorName,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });
});
