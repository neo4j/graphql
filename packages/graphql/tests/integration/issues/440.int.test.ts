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
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";

describe("https://github.com/neo4j/graphql/issues/440", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const typeDefs = gql`
        type Video {
            id: ID! @id(autogenerate: false)
            categories: [Category!]! @relationship(type: "IS_CATEGORIZED_AS", direction: OUT)
        }

        type Category {
            id: ID! @id(autogenerate: false)
            videos: [Video!]! @relationship(type: "IS_CATEGORIZED_AS", direction: IN)
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to disconnect 2 nodes while creating one in the same mutation", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const videoID = generate({ charset: "alphabetic" });
        const catIDs = Array(3)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await session.run(
            `CREATE (v:Video {id: $videoID}),
                (v)-[:IS_CATEGORIZED_AS]->(:Category {id: $c0}),
                (v)-[:IS_CATEGORIZED_AS]->(:Category {id: $c1})`,
            { videoID, c0: catIDs[0], c1: catIDs[1] }
        );

        const variableValues = {
            id: videoID,
            fields: {
                categories: [
                    {
                        disconnect: [
                            {
                                where: {
                                    node: { id_IN: [catIDs[0], catIDs[1]] },
                                },
                            },
                        ],
                        create: [{ node: { id: catIDs[2] } }],
                    },
                ],
            },
        };

        const mutation = `
            mutation updateVideos($id: ID!, $fields: VideoUpdateInput!) {
                updateVideos(where: {id: $id}, update: $fields) {
                    videos {
                        id
                        categories {
                            id
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect((mutationResult?.data as any)?.updateVideos?.videos).toHaveLength(1);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].id).toEqual(videoID);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].categories).toHaveLength(1);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].categories[0].id).toEqual(catIDs[2]);
        } finally {
            await session.close();
        }
    });

    test("should be able to delete 2 nodes while creating one in the same mutation", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const videoID = generate({ charset: "alphabetic" });
        const catIDs = Array(3)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await session.run(
            `CREATE (v:Video {id: $videoID}),
                (v)-[:IS_CATEGORIZED_AS]->(:Category {id: $c0}),
                (v)-[:IS_CATEGORIZED_AS]->(:Category {id: $c1})`,
            { videoID, c0: catIDs[0], c1: catIDs[1] }
        );

        const variableValues = {
            id: videoID,
            fields: {
                categories: [
                    {
                        delete: [
                            {
                                where: {
                                    node: { id_IN: [catIDs[0], catIDs[1]] },
                                },
                            },
                        ],
                        create: [{ node: { id: catIDs[2] } }],
                    },
                ],
            },
        };

        const mutation = `
            mutation updateVideos($id: ID!, $fields: VideoUpdateInput!) {
                updateVideos(where: {id: $id}, update: $fields) {
                    videos {
                        id
                        categories {
                            id
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect((mutationResult?.data as any)?.updateVideos?.videos).toHaveLength(1);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].id).toEqual(videoID);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].categories).toHaveLength(1);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].categories[0].id).toEqual(catIDs[2]);
        } finally {
            await session.close();
        }
    });

    test("should be able to delete 2 nodes while creating one in the same mutation - with subscriptions", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                subscriptions: new TestSubscriptionsPlugin(),
            },
        });
        const videoID = generate({ charset: "alphabetic" });
        const catIDs = Array(3)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await session.run(
            `CREATE (v:Video {id: $videoID}),
                (v)-[:IS_CATEGORIZED_AS]->(:Category {id: $c0}),
                (v)-[:IS_CATEGORIZED_AS]->(:Category {id: $c1})`,
            { videoID, c0: catIDs[0], c1: catIDs[1] }
        );

        const variableValues = {
            id: videoID,
            fields: {
                categories: [
                    {
                        delete: [
                            {
                                where: {
                                    node: { id_IN: [catIDs[0], catIDs[1]] },
                                },
                            },
                        ],
                        create: [{ node: { id: catIDs[2] } }],
                    },
                ],
            },
        };

        const mutation = `
            mutation updateVideos($id: ID!, $fields: VideoUpdateInput!) {
                updateVideos(where: {id: $id}, update: $fields) {
                    videos {
                        id
                        categories {
                            id
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect((mutationResult?.data as any)?.updateVideos?.videos).toHaveLength(1);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].id).toEqual(videoID);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].categories).toHaveLength(1);
            expect((mutationResult?.data as any)?.updateVideos?.videos[0].categories[0].id).toEqual(catIDs[2]);
        } finally {
            await session.close();
        }
    });
});
