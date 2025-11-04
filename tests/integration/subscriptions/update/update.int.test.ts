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

import { gql } from "graphql-tag";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Subscriptions update", () => {
    const testHelper = new TestHelper();
    let plugin: TestSubscriptionsEngine;

    let typeActor: UniqueType;
    let typeMovie: UniqueType;

    beforeEach(async () => {
        typeActor = testHelper.createUniqueType("Actor");
        typeMovie = testHelper.createUniqueType("Movie");

        plugin = new TestSubscriptionsEngine();
        const typeDefs = gql`
            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${typeMovie.name} {
                id: ID!
                name: String
                tagline: String
                length: Int
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should delete a nested actor and one of their nested movies, within an update block abc", async () => {
        const movieId1 = "movieId1";
        const movieId2 = "movieId2";

        const actorName1 = "Keanu";
        const actorName2 = "Rob";

        const mutation = `
                mutation($movieId1: ID, $actorName1: String, $movieId2: ID) {
                    ${typeMovie.operations.update}(
                        where: { id: $movieId1 }
                        update: {
                            actors: { delete: { where: { node: { name: $actorName1 } }, delete: { movies: { where: { node: { id: $movieId2 } } } } } }
                        }
                    ) {
                        ${typeMovie.plural} {
                            id
                            actors {
                                name
                            }
                        }
                    }
                }
            `;

        await testHelper.executeCypher(
            `
                    CREATE (m1:${typeMovie.name} {id: $movieId1})
                    CREATE (m2:${typeMovie.name} {id: $movieId2})
    
                    CREATE (a1:${typeActor.name} {name: $actorName1})
                    CREATE (a2:${typeActor.name} {name: $actorName2})
    
                    MERGE (a1)-[:ACTED_IN]->(m1)
                    MERGE (a1)-[:ACTED_IN]->(m2)
    
                    MERGE (a2)-[:ACTED_IN]->(m1)
                    MERGE (a2)-[:ACTED_IN]->(m2)
                `,
            {
                movieId1,
                actorName1,
                actorName2,
                movieId2,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(mutation, {
            variableValues: { movieId1, actorName1, movieId2 },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: [{ id: movieId1, actors: [{ name: actorName2 }] }],
        });

        const movie2 = await testHelper.executeCypher(
            `
                  MATCH (m:${typeMovie.name} {id: $id})
                  RETURN m
                `,
            { id: movieId2 }
        );

        expect(movie2.records).toHaveLength(0);
    });

    test("simple update with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(where: { id: "1" }, update: { name: "The Matrix" }) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE (:${typeMovie.name} { id: "1", name: "Terminator" })
            CREATE (:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(String),
                timestamp: expect.any(Number),
                event: "update",
                properties: { old: { id: "1", name: "Terminator" }, new: { id: "1", name: "The Matrix" } },
                typename: typeMovie.name,
            },
        ]);
    });

    test("multiple nodes update with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(where: { id_IN: ["1", "2"] }, update: { name: "The Matrix" }) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE (:${typeMovie.name} { id: "1", name: "Terminator" })
            CREATE (:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual(
            expect.toIncludeSameMembers([
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: { old: { id: "1", name: "Terminator" }, new: { id: "1", name: "The Matrix" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: {
                        old: { id: "2", name: "The Many Adventures of Winnie the Pooh" },
                        new: { id: "2", name: "The Matrix" },
                    },
                    typename: typeMovie.name,
                },
            ])
        );
    });

    test("nested update with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(
                where: { id_IN: ["1", "2"] }
                update: {
                    name: "The Matrix"
                    actors: [
                        {
                            where: { node: { name: "arthur" } }
                            update: {
                                node: {
                                    name: "ford"
                                }
                            }
                        }
                    ]
                }
            ) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE (m1:${typeMovie.name} { id: "1", name: "Terminator" })
            CREATE (m2:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
            CREATE (m3:${typeMovie.name} { id: "3", name: "Terminator 2" })
            CREATE (m4:${typeMovie.name} { id: "4", name: "The Many Adventures of Winnie the Pooh 2" })

            CREATE(a1:${typeActor.name} {name: "arthur"})-[:ACTED_IN]->(m1)
            CREATE(a1)-[:ACTED_IN]->(m2)

            CREATE(a2:${typeActor.name} {name: "arthur"})-[:ACTED_IN]->(m3)
            CREATE(a2)-[:ACTED_IN]->(m4)
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: expect.toIncludeSameMembers([{ id: "1" }, { id: "2" }]),
        });

        expect(plugin.eventList).toEqual(
            expect.toIncludeSameMembers([
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: { old: { id: "1", name: "Terminator" }, new: { id: "1", name: "The Matrix" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: {
                        old: { id: "2", name: "The Many Adventures of Winnie the Pooh" },
                        new: { id: "2", name: "The Matrix" },
                    },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: {
                        old: { name: "arthur" },
                        new: { name: "ford" },
                    },
                    typename: typeActor.name,
                },
            ])
        );
    });

    test("triple nested update with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(
                where: { id_IN: ["1", "2"] }
                update: {
                    name: "The Matrix"
                    actors: [
                        {
                            where: { node: { name: "arthur" } }
                            update: {
                                node: {
                                    name: "ford"
                                    movies: [
                                        {
                                            where: { node: { id_IN: ["3", "4"] } }
                                            update: { node: { name: "new movie title" } }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                }
            ) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE (m1:${typeMovie.name} { id: "1", name: "Terminator" })
            CREATE (m2:${typeMovie.name} { id: "2", name: "The Many Adventures of Winnie the Pooh" })
            CREATE (m3:${typeMovie.name} { id: "3", name: "Terminator 2" })
            CREATE (m4:${typeMovie.name} { id: "4", name: "The Many Adventures of Winnie the Pooh 2" })

            CREATE(a1:${typeActor.name} {name: "arthur"})-[:ACTED_IN]->(m1)
            CREATE(a1)-[:ACTED_IN]->(m2)
            CREATE(a1)-[:ACTED_IN]->(m3)
            CREATE(a1)-[:ACTED_IN]->(m4)

            CREATE(a2:${typeActor.name} {name: "arthur"})-[:ACTED_IN]->(m3)
            CREATE(a2)-[:ACTED_IN]->(m4)
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual(
            expect.toIncludeSameMembers([
                {
                    event: "update",
                    id: expect.any(String),
                    properties: { new: { id: "1", name: "The Matrix" }, old: { id: "1", name: "Terminator" } },
                    timestamp: expect.any(Number),
                    typename: typeMovie.name,
                },
                {
                    event: "update",
                    id: expect.any(String),
                    properties: { new: { name: "ford" }, old: { name: "arthur" } },
                    timestamp: expect.any(Number),
                    typename: typeActor.name,
                },
                {
                    event: "update",
                    id: expect.any(String),
                    properties: { new: { id: "3", name: "new movie title" }, old: { id: "3", name: "Terminator 2" } },
                    timestamp: expect.any(Number),
                    typename: typeMovie.name,
                },
                {
                    event: "update",
                    id: expect.any(String),
                    properties: {
                        new: { id: "4", name: "new movie title" },
                        old: { id: "4", name: "The Many Adventures of Winnie the Pooh 2" },
                    },
                    timestamp: expect.any(Number),
                    typename: typeMovie.name,
                },
                {
                    event: "update",
                    id: expect.any(String),
                    properties: {
                        new: { id: "2", name: "The Matrix" },
                        old: { id: "2", name: "The Many Adventures of Winnie the Pooh" },
                    },
                    timestamp: expect.any(Number),
                    typename: typeMovie.name,
                },
            ])
        );
    });

    test("update mutation with nested create", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(
                where: { id: "1" }
                update: {
                    name: "Terminator 2"
                    actors: {
                        create: {
                            node: {
                                name: "Arnold"
                            }
                        }
                    }
                }
            ) {
                ${typeMovie.plural} {
                    id
                    actors {
                        name
                    }
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE (m1:${typeMovie.name} { id: "1", name: "Terminator" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: [{ id: "1", actors: [{ name: "Arnold" }] }],
        });

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: { old: { id: "1", name: "Terminator" }, new: { id: "1", name: "Terminator 2" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: {
                        old: undefined,
                        new: { name: "Arnold" },
                    },
                    typename: typeActor.name,
                },
            ])
        );
    });

    test("update mutation with nested delete", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(
                where: { id: "1" }
                update: {
                    name: "Terminator 2"
                    actors: {
                        delete: {
                            where: {
                                node: {
                                    name: "Arnold"
                                }
                            }
                        }
                    }
                }
            ) {
                ${typeMovie.plural} {
                    id
                    actors {
                        name
                    }
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE (m1:${typeMovie.name} { id: "1", name: "Terminator" })
            CREATE (m1)<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: [{ id: "1", actors: [] }],
        });

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: { old: { id: "1", name: "Terminator" }, new: { id: "1", name: "Terminator 2" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: {
                        old: { name: "Arnold" },
                        new: undefined,
                    },
                    typename: typeActor.name,
                },
            ])
        );
    });

    test("update mutation with nested delete and create", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(
                where: { id: "1" }
                update: {
                    name: "Terminator 2"
                    actors: {
                        delete: {
                            where: {
                                node: {
                                    name: "Arnold"
                                }
                            }
                        }
                        create: {
                            node: {
                                name: "New Arnold"
                            }
                        }
                    }
                }
            ) {
                ${typeMovie.plural} {
                    id
                    actors {
                        name
                    }
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE (m1:${typeMovie.name} { id: "1", name: "Terminator" })
            CREATE (m1)<-[:ACTED_IN]-(:${typeActor.name} { name: "Arnold" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: [{ id: "1", actors: [{ name: "New Arnold" }] }],
        });

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: { old: { id: "1", name: "Terminator" }, new: { id: "1", name: "Terminator 2" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: {
                        old: { name: "Arnold" },
                        new: undefined,
                    },
                    typename: typeActor.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: {
                        old: undefined,
                        new: { name: "New Arnold" },
                    },
                    typename: typeActor.name,
                },
            ])
        );
    });

    test("update mutation with nested delete and create deeply nested", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(
                where: { id: "1" }
                update: {
                    name: "Terminator 2"
                    actors: {
                        delete: {
                            where: {
                                node: {
                                    name: "Arnold"
                                }
                            }
                            delete: {
                                movies: {
                                    where: {
                                        node: {
                                            name: "Predator"
                                        }
                                    }
                                }
                            }
                        }
                        create: {
                            node: {
                                name: "New Arnold"
                                movies: {
                                    create: {
                                        node: {
                                            id: "2"
                                            name: "Terminator 3"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            ) {
                ${typeMovie.plural} {
                    id
                    actors {
                        name
                    }
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE (m1:${typeMovie.name} { id: "1", name: "Terminator" })
            CREATE (m1)<-[:ACTED_IN]-(a1:${typeActor.name} { name: "Arnold" })
            CREATE (a1)-[:ACTED_IN]->(:${typeMovie.name} { name: "Predator" })
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: [{ id: "1", actors: [{ name: "New Arnold" }] }],
        });

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: { old: { id: "1", name: "Terminator" }, new: { id: "1", name: "Terminator 2" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: {
                        old: { name: "Arnold" },
                        new: undefined,
                    },
                    typename: typeActor.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "delete",
                    properties: {
                        old: { name: "Predator" },
                        new: undefined,
                    },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: {
                        old: undefined,
                        new: { name: "New Arnold" },
                    },
                    typename: typeActor.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: {
                        old: undefined,
                        new: { id: "2", name: "Terminator 3" },
                    },
                    typename: typeMovie.name,
                },
            ])
        );
    });

    test("update multiple properties on single node", async () => {
        const query = `
            mutation {
                ${typeMovie.operations.update}(where: { id: "1" }, update: { name: "The Matrix", tagline: "Don't worry about cookies" }) {
                    ${typeMovie.plural} {
                        id
                    }
                }
            }
            `;

        await testHelper.executeCypher(`
                CREATE (:${typeMovie.name} { id: "1", name: "Terminator", tagline: "I'll be back" })
            `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(String),
                timestamp: expect.any(Number),
                event: "update",
                properties: {
                    old: { id: "1", name: "Terminator", tagline: "I'll be back" },
                    new: { id: "1", name: "The Matrix", tagline: "Don't worry about cookies" },
                },
                typename: typeMovie.name,
            },
        ]);
    });

    test("update property using mathematical operator", async () => {
        const query = `
            mutation {
                ${typeMovie.operations.update}(where: { id: "1" }, update: { length_INCREMENT: 1 }) {
                    ${typeMovie.plural} {
                        id
                        length
                    }
                }
            }
            `;

        await testHelper.executeCypher(`
                CREATE (:${typeMovie.name} { id: "1", length: 0 })
            `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: [{ id: "1", length: 1 }],
        });

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(String),
                timestamp: expect.any(Number),
                event: "update",
                properties: {
                    old: { id: "1", length: 0 },
                    new: { id: "1", length: 1 },
                },
                typename: typeMovie.name,
            },
        ]);
    });

    test("update multiple properties using mathematical operator", async () => {
        const query = `
            mutation {
                ${typeMovie.operations.update}(where: { id: "1" }, update: { name: "It's not Matrix", length_INCREMENT: 1 }) {
                    ${typeMovie.plural} {
                        id
                        name
                        length
                    }
                }
            }
            `;

        await testHelper.executeCypher(`
                CREATE (:${typeMovie.name} { id: "1", name: "The Matrix", length: 0 })
            `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: [{ id: "1", name: "It's not Matrix", length: 1 }],
        });

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(String),
                timestamp: expect.any(Number),
                event: "update",
                properties: {
                    old: { id: "1", name: "The Matrix", length: 0 },
                    new: { id: "1", name: "It's not Matrix", length: 1 },
                },
                typename: typeMovie.name,
            },
        ]);
    });

    test("update nested properties using mathematical operator", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.update}(
                where: { id: "1" }
                update: {
                    name: "The Matrix"
                    length_INCREMENT: 10
                    actors: [
                        {
                            where: { node: { name: "Keanu_wrong" } }
                            update: {
                                node: {
                                    name: "Keanu"
                                }
                            }
                        }
                    ]
                }
            ) {
                ${typeMovie.plural} {
                    id
                    name
                    length
                    actors {
                        name
                    }
                }
            }
        }
        `;

        await testHelper.executeCypher(`
            CREATE(m1:${typeMovie.name} { id: "1", length: 0, name: "The wrong Matrix" })
            CREATE(a1:${typeActor.name} {name: "Keanu_wrong"})-[:ACTED_IN]->(m1)
        `);

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data[typeMovie.operations.update]).toEqual({
            [typeMovie.plural]: [{ id: "1", name: "The Matrix", length: 10, actors: [{ name: "Keanu" }] }],
        });

        expect(plugin.eventList).toEqual([
            {
                id: expect.any(String),
                timestamp: expect.any(Number),
                event: "update",
                properties: {
                    old: { name: "Keanu_wrong" },
                    new: { name: "Keanu" },
                },
                typename: typeActor.name,
            },
            {
                id: expect.any(String),
                timestamp: expect.any(Number),
                event: "update",
                properties: {
                    old: { id: "1", length: 0, name: "The wrong Matrix" },
                    new: { id: "1", length: 10, name: "The Matrix" },
                },
                typename: typeMovie.name,
            },
        ]);
    });
});
