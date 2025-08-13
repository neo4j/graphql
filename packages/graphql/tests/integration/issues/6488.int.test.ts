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

describe("https://github.com/neo4j/graphql/issues/6572", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let MediaAssetDerivative: UniqueType;
    let MediaAssetDerivativeType: UniqueType;

    beforeAll(async () => {
        MediaAssetDerivative = testHelper.createUniqueType("MediaAssetDerivative");
        MediaAssetDerivativeType = testHelper.createUniqueType("MediaAssetDerivativeType");

        typeDefs = /* GraphQL */ `
            type ${MediaAssetDerivative}
                @mutation(operations: [CREATE, UPDATE, DELETE])
                @node
                @subscription(events: []) {
                changedAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                createdAt: DateTime @timestamp(operations: [CREATE])
                id: String! @settable(onCreate: true, onUpdate: false)
                isPublic: Boolean! @default(value: false)
                type: [${MediaAssetDerivativeType}!]!
                    @relationship(
                        type: "MEDIAASSETDERIVATIVE_IS_OF_MEDIAASSETDERIVATIVETYPE"
                        properties: "MediaassetderivativeIsOfMediaassetderivativetypeProperties"
                        direction: OUT
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
            }

            type ${MediaAssetDerivativeType}
                @mutation(operations: [CREATE, UPDATE, DELETE])
                @node
                @subscription(events: []) {
                id: Int! @settable(onCreate: true, onUpdate: false)
                value: String! @populatedBy(
                        callback: "AnotherCallback"
                        operations: [UPDATE]
                    )
            }

            type MediaassetderivativeIsOfMediaassetderivativetypeProperties @relationshipProperties {
                _pkFrom: String!
                    @populatedBy(
                        callback: "MEDIAASSETDERIVATIVE_IS_OF_MEDIAASSETDERIVATIVETYPE_Callback"
                        operations: [CREATE, UPDATE]
                    )
                    @settable(onCreate: false, onUpdate: false)
            }
        `;

        await testHelper.executeCypher(`
            CREATE(:${MediaAssetDerivativeType} { id: 1, value: "ShouldNotChange" })
        `);

        const callback1 = () => Promise.resolve("FROM_1");
        const callback2 = () => Promise.resolve("New Value");

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        MEDIAASSETDERIVATIVE_IS_OF_MEDIAASSETDERIVATIVETYPE_Callback: callback1,
                        AnotherCallback: callback2,
                    },
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("calls populatedBy on create -> connect mutation", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${MediaAssetDerivative.operations.create}(
                    input: [{ id: "1", type: { connect: [{ where: { node: { id: { eq: 1 } } } }] } }]
                ) {
                    __typename
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        await testHelper
            .expectRelationship(
                MediaAssetDerivative,
                MediaAssetDerivativeType,
                "MEDIAASSETDERIVATIVE_IS_OF_MEDIAASSETDERIVATIVETYPE"
            )
            .toEqual([
                {
                    from: {
                        id: "1",
                        changedAt: expect.toBeDate(),
                        createdAt: expect.toBeDate(),
                        isPublic: false,
                    },
                    to: {
                        id: 1,
                        value: "ShouldNotChange",
                    },
                    relationship: {
                        _pkFrom: "FROM_1",
                    },
                },
            ]);
    });
});
