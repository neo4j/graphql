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

import { generate } from "randomstring";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/440", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    let Video: UniqueType;
    let Category: UniqueType;

    beforeEach(() => {
        Video = testHelper.createUniqueType("Video");
        Category = testHelper.createUniqueType("Category");

        typeDefs = `
        type ${Video} {
            id: ID! @unique
            categories: [${Category}!]! @relationship(type: "IS_CATEGORIZED_AS", direction: OUT)
        }

        type ${Category} {
            id: ID! @unique
            videos: [${Video}!]! @relationship(type: "IS_CATEGORIZED_AS", direction: IN)
        }
    `;
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be able to disconnect 2 nodes while creating one in the same mutation", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        const videoID = generate({ charset: "alphabetic" });
        const catIDs = Array(3)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await testHelper.executeCypher(
            `CREATE (v:${Video} {id: $videoID}),
                (v)-[:IS_CATEGORIZED_AS]->(:${Category} {id: $c0}),
                (v)-[:IS_CATEGORIZED_AS]->(:${Category} {id: $c1})`,
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
            mutation updateVideos($id: ID!, $fields: ${Video}UpdateInput!) {
                ${Video.operations.update}(where: {id: $id}, update: $fields) {
                    ${Video.plural} {
                        id
                        categories {
                            id
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const mutationResult = await testHelper.executeGraphQL(mutation, {
            variableValues,
        });

        expect(mutationResult.errors).toBeFalsy();

        expect((mutationResult?.data as any)[Video.operations.update][Video.plural]).toHaveLength(1);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].id).toEqual(videoID);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].categories).toHaveLength(1);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].categories[0].id).toEqual(
            catIDs[2]
        );
    });

    test("should be able to delete 2 nodes while creating one in the same mutation", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
        const videoID = generate({ charset: "alphabetic" });
        const catIDs = Array(3)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await testHelper.executeCypher(
            `CREATE (v:${Video} {id: $videoID}),
                (v)-[:IS_CATEGORIZED_AS]->(:${Category} {id: $c0}),
                (v)-[:IS_CATEGORIZED_AS]->(:${Category} {id: $c1})`,
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
            mutation updateVideos($id: ID!, $fields: ${Video}UpdateInput!) {
                ${Video.operations.update}(where: {id: $id}, update: $fields) {
                    ${Video.plural} {
                        id
                        categories {
                            id
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const mutationResult = await testHelper.executeGraphQL(mutation, {
            variableValues,
        });

        expect(mutationResult.errors).toBeFalsy();

        expect((mutationResult?.data as any)[Video.operations.update][Video.plural]).toHaveLength(1);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].id).toEqual(videoID);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].categories).toHaveLength(1);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].categories[0].id).toEqual(
            catIDs[2]
        );
    });

    test("should be able to delete 2 nodes while creating one in the same mutation - with subscriptions", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: new TestSubscriptionsEngine(),
            },
        });
        const videoID = generate({ charset: "alphabetic" });
        const catIDs = Array(3)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await testHelper.executeCypher(
            `CREATE (v:${Video} {id: $videoID}),
                (v)-[:IS_CATEGORIZED_AS]->(:${Category} {id: $c0}),
                (v)-[:IS_CATEGORIZED_AS]->(:${Category} {id: $c1})`,
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
            mutation updateVideos($id: ID!, $fields: ${Video}UpdateInput!) {
                ${Video.operations.update}(where: {id: $id}, update: $fields) {
                    ${Video.plural} {
                        id
                        categories {
                            id
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const mutationResult = await testHelper.executeGraphQL(mutation, {
            variableValues,
        });

        expect(mutationResult.errors).toBeFalsy();

        expect((mutationResult?.data as any)[Video.operations.update][Video.plural]).toHaveLength(1);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].id).toEqual(videoID);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].categories).toHaveLength(1);
        expect((mutationResult?.data as any)[Video.operations.update][Video.plural][0].categories[0].id).toEqual(
            catIDs[2]
        );
    });
});
