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

describe("https://github.com/neo4j/graphql/issues/6981", () => {
    let TypeCodePlaceholder: UniqueType;
    let TypeCodeValue: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        TypeCodePlaceholder = testHelper.createUniqueType("TypeCodePlaceholder");
        TypeCodeValue = testHelper.createUniqueType("TypeCodeValue");

        const typeDefs = /* GraphQL */ `
            type ${TypeCodePlaceholder} @mutation(operations: [CREATE, UPDATE, DELETE]) @node @subscription(events: []) {
                id: String!
                values: [${TypeCodeValue}!]!
                    @relationship(
                        type: "TYPECODEPLACEHOLDER_HAS_TYPECODEVALUE"
                        properties: "TypecodeplaceholderHasTypecodevalueProperties"
                        direction: OUT
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
            }

            type ${TypeCodeValue} @mutation(operations: [CREATE, UPDATE, DELETE]) @node @subscription(events: []) {
                id: String!
            }

            type TypecodeplaceholderHasTypecodevalueProperties @relationshipProperties {
                order: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE (tcp:${TypeCodePlaceholder} {id: "A"})
            CREATE (tcp)-[:TYPECODEPLACEHOLDER_HAS_TYPECODEVALUE {order: 1}]->(:${TypeCodeValue} {id: "B"})
            CREATE (tcp)-[:TYPECODEPLACEHOLDER_HAS_TYPECODEVALUE {order: 2}]->(:${TypeCodeValue} {id: "C"})

        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should match 1 edge by node filter, aggregate count 1", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${TypeCodePlaceholder.operations.update}(
                    where: { id: { eq: "A" } }
                    update: {
                        values: [
                            { update: { where: { node: { id: { eq: "B" } } }, edge: { order: { set: 2 } } } }
                            { update: { where: { node: { id: { eq: "C" } } }, edge: { order: { set: 1 } } } }
                        ]
                    }
                ) {
                    ${TypeCodePlaceholder.plural} {
                        valuesConnection {
                            edges {
                                properties {
                                    order
                                }
                                node {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();

        expect(result.data).toEqual({
            [TypeCodePlaceholder.operations.update]: {
                [TypeCodePlaceholder.plural]: [
                    {
                        valuesConnection: {
                            edges: expect.toIncludeSameMembers([
                                {
                                    properties: {
                                        order: 2,
                                    },
                                    node: {
                                        id: "B",
                                    },
                                },
                                {
                                    properties: {
                                        order: 1,
                                    },
                                    node: {
                                        id: "C",
                                    },
                                },
                            ]),
                        },
                    },
                ],
            },
        });

        await testHelper.expectRelationship(TypeCodePlaceholder, TypeCodeValue).toIncludeSameMembers([
            {
                from: {
                    id: "A",
                },
                relationship: {
                    order: 2,
                },
                to: {
                    id: "B",
                },
            },
            {
                from: {
                    id: "A",
                },
                relationship: {
                    order: 1,
                },
                to: {
                    id: "C",
                },
            },
        ]);
    });
});
