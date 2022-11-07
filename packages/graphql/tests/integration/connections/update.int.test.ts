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
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";

describe("Connections -> Update", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let bookmarks: string[];

    const clientType = generateUniqueType("Client");
    const hasSponsorType = generateUniqueType("HasSponsor");

    const client1 = {
        id: "1",
        name: "Client 1 Name",
    };
    const client2 = {
        id: "1001",
        name: "Second Name",
    };
    const edge1 = {
        type: "someType",
        startDate: "1972-11-01",
    };
    const edge2 = {
        type: "Another Edge Type",
        startDate: "2022-11-07",
        endDate: "2022-11-30",
    };

    const typeDefs = gql`
        type ${clientType.name} {
            id: String!
            name: String!
            sponsor: [${clientType.name}!]! @relationship(type: "HAS_SPONSOR", properties: "${hasSponsorType.name}", direction: OUT)
        }

        interface ${hasSponsorType.name} @relationshipProperties {
            type: String!
            startDate: Date!
            endDate: Date
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(
                `
                    CREATE (client1:${clientType.name})
                    CREATE (client2:${clientType.name})
                    SET client1 = $client1
                    SET client2 = $client2
                `,
                { client1, client2 }
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }
    });

    afterEach(async () => {
        const session = await neo4j.getSession();

        try {
            await session.run(
                `
                    MATCH (clients:${clientType.name})
                    DETACH DELETE clients
                `,
                {}
            );
        } finally {
            await session.close();
        }
    });

    describe("Relationship Properties", () => {
        test("Creates new connection when none exist", async () => {
            const session = await neo4j.getSession();

            const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

            const query = `
                mutation {
                    ${clientType.operations.update}(
                        where: { id: "${client1.id}" },
                        connect: {
                            sponsor: [
                                {
                                    where: {
                                        node: {
                                            id: "${client2.id}"
                                        }
                                    }
                                    edge: {
                                        type: "${edge1.type}"
                                        startDate: "${edge1.startDate}"
                                    }
                                }
                            ]
                        }
                    ) {
                        ${clientType.plural} {
                            name
                            sponsorConnection {
                                edges {
                                    node {
                                        name
                                    }
                                    type
                                    startDate
                                }
                            }
                        }
                    }
                }
            `;

            try {
                await neoSchema.checkNeo4jCompat();

                const result = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                });

                expect(result.errors).toBeFalsy();

                expect(result?.data?.[clientType.operations.update]?.[clientType.plural]).toEqual([
                    {
                        name: client1.name,
                        sponsorConnection: {
                            edges: [
                                {
                                    node: {
                                        name: client2.name,
                                    },
                                    ...edge1,
                                },
                            ],
                        },
                    },
                ]);
            } finally {
                await session.close();
            }
        });

        test("Updates existing relationship", async () => {
            const session = await neo4j.getSession();

            const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

            const initialConnectionQuery = `
                mutation {
                    ${clientType.operations.update}(
                        where: { id: "${client1.id}" },
                        connect: {
                            sponsor: [
                                {
                                    where: {
                                        node: {
                                            id: "${client2.id}"
                                        }
                                    }
                                    edge: {
                                        type: "${edge1.type}"
                                        startDate: "${edge1.startDate}"
                                    }
                                }
                            ]
                        }
                    ) {
                        ${clientType.plural} {
                            name
                            sponsorConnection {
                                edges {
                                    node {
                                        name
                                    }
                                    type
                                    startDate
                                    endDate
                                }
                            }
                        }
                    }
                }
            `;

            const updateConnectionQuery = `
                mutation {
                    ${clientType.operations.update}(
                        where: { id: "${client1.id}" },
                        connect: {
                            sponsor: [
                                {
                                    where: {
                                        node: {
                                            id: "${client2.id}"
                                        }
                                    }
                                    edge: {
                                        type: "${edge2.type}"
                                        startDate: "${edge2.startDate}"
                                        endDate: "${edge2.endDate}"
                                    }
                                }
                            ]
                        }
                    ) {
                        ${clientType.plural} {
                            name
                            sponsorConnection {
                                edges {
                                    node {
                                        name
                                    }
                                    type
                                    startDate
                                    endDate
                                }
                            }
                        }
                    }
                }
            `;

            try {
                await neoSchema.checkNeo4jCompat();

                const initialConnectionResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: initialConnectionQuery,
                    contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                });
                const updateConnectionResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: updateConnectionQuery,
                    contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                });

                expect(initialConnectionResult.errors).toBeFalsy();
                expect(updateConnectionResult.errors).toBeFalsy();

                expect(initialConnectionResult?.data?.[clientType.operations.update]?.[clientType.plural]).toEqual([
                    {
                        name: client1.name,
                        sponsorConnection: {
                            edges: [
                                {
                                    node: {
                                        name: client2.name,
                                    },
                                    ...edge1,
                                    endDate: null,
                                },
                            ],
                        },
                    },
                ]);
                expect(updateConnectionResult?.data?.[clientType.operations.update]?.[clientType.plural]).toEqual([
                    {
                        name: client1.name,
                        sponsorConnection: {
                            edges: [
                                {
                                    node: {
                                        name: client2.name,
                                    },
                                    ...edge2,
                                },
                            ],
                        },
                    },
                ]);
            } finally {
                await session.close();
            }
        });

        test("Creates duplicate relationships", async () => {
            const session = await neo4j.getSession();

            const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

            const initialConnectionQuery = `
                mutation {
                    ${clientType.operations.update}(
                        where: { id: "${client1.id}" },
                        connect: {
                            sponsor: [
                                {
                                    where: {
                                        node: {
                                            id: "${client2.id}"
                                        }
                                    }
                                    edge: {
                                        type: "${edge1.type}"
                                        startDate: "${edge1.startDate}"
                                    }
                                }
                            ]
                        }
                    ) {
                        ${clientType.plural} {
                            name
                            sponsorConnection {
                                edges {
                                    node {
                                        name
                                    }
                                    type
                                    startDate
                                    endDate
                                }
                            }
                        }
                    }
                }
            `;

            const updateConnectionQuery = `
                mutation {
                    ${clientType.operations.update}(
                        where: { id: "${client1.id}" },
                        connect: {
                            sponsor: [
                                {
                                    createDuplicates: true
                                    where: {
                                        node: {
                                            id: "${client2.id}"
                                        }
                                    }
                                    edge: {
                                        type: "${edge2.type}"
                                        startDate: "${edge2.startDate}"
                                        endDate: "${edge2.endDate}"
                                    }
                                }
                            ]
                        }
                    ) {
                        ${clientType.plural} {
                            name
                            sponsorConnection {
                                edges {
                                    node {
                                        name
                                    }
                                    type
                                    startDate
                                    endDate
                                }
                            }
                        }
                    }
                }
            `;

            try {
                await neoSchema.checkNeo4jCompat();

                const initialConnectionResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: initialConnectionQuery,
                    contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                });
                const updateConnectionResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: updateConnectionQuery,
                    contextValue: neo4j.getContextValuesWithBookmarks(bookmarks),
                });

                expect(initialConnectionResult.errors).toBeFalsy();
                expect(updateConnectionResult.errors).toBeFalsy();

                expect(initialConnectionResult?.data?.[clientType.operations.update]?.[clientType.plural]).toEqual([
                    {
                        name: client1.name,
                        sponsorConnection: {
                            edges: [
                                {
                                    node: {
                                        name: client2.name,
                                    },
                                    ...edge1,
                                    endDate: null,
                                },
                            ],
                        },
                    },
                ]);
                expect(updateConnectionResult?.data?.[clientType.operations.update]?.[clientType.plural]).toEqual([
                    {
                        name: client1.name,
                        sponsorConnection: {
                            edges: expect.toIncludeSameMembers([
                                {
                                    node: {
                                        name: client2.name,
                                    },
                                    ...edge1,
                                    endDate: null,
                                },
                                {
                                    node: {
                                        name: client2.name,
                                    },
                                    ...edge2,
                                },
                            ]),
                        },
                    },
                ]);
            } finally {
                await session.close();
            }
        });
    });

    describe("Union Relationships", () => {
        test("Creates new connection when none exist", () => {});

        test("Updates existing relationship", () => {});

        test("Creates duplicate relationships", () => {});
    });

    describe("Interface Relationships", () => {
        test("Creates new connection when none exist", () => {});

        test("Updates existing relationship", () => {});

        test("Creates duplicate relationships", () => {});
    });
});
