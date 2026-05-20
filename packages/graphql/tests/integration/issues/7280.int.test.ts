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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7280", () => {
    let Asset: UniqueType;
    let AssetVersion: UniqueType;
    let AssetDerivative: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        Asset = testHelper.createUniqueType("Asset");
        AssetVersion = testHelper.createUniqueType("AssetVersion");
        AssetDerivative = testHelper.createUniqueType("AssetDerivative");

        const typeDefs = /* GraphQL */ `
            type ${Asset} @node {
                id: String!
                versions: [${AssetVersion}!]!
                    @relationship(
                        type: "ASSET_HAS_ASSETVERSION"
                        direction: OUT
                        nestedOperations: [CREATE]
                        queryDirection: DIRECTED
                    )
            }

            type ${AssetVersion} @node {
                id: String!
                derivatives: [${AssetDerivative}!]!
                    @relationship(
                        type: "ASSETVERSION_HAS_ASSETDERIVATIVE"
                        direction: OUT
                        nestedOperations: [CREATE]
                        queryDirection: DIRECTED
                    )
                thumbnail: [${AssetDerivative}!]!
                    @relationship(
                        type: "ASSETVERSION_HAS_THUMBNAIL_ASSETDERIVATIVE"
                        direction: OUT
                        nestedOperations: [CONNECT]
                        queryDirection: DIRECTED
                    )
            }

            type ${AssetDerivative} @node {
                id: String!
                thumbnailOfVersion: [${AssetVersion}!]!
                    @relationship(
                        type: "ASSETVERSION_HAS_THUMBNAIL_ASSETDERIVATIVE"
                        direction: IN
                        nestedOperations: [CONNECT]
                        queryDirection: DIRECTED
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create relationships to created nodes in nested creation of nodes", async () => {
        const query = /* GraphQL */ `
            mutation NestedCreateConnectsToCreatedAncestor {
                ${Asset.operations.create}(
                    input: [
                        {
                            id: "a1"
                            versions: {
                                create: [
                                    {
                                        node: {
                                            id: "v1"
                                            derivatives: {
                                                create: [
                                                    {
                                                        node: {
                                                            id: "d1"
                                                            thumbnailOfVersion: {
                                                                connect: [{ where: { node: { id: { eq: "v1" } } } }]
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Asset.operations.create]: {
                info: {
                    nodesCreated: 3,
                    relationshipsCreated: 3,
                },
            },
        });
    });
});
