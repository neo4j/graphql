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

describe("https://github.com/neo4j/graphql/issues/7372", () => {
    let ProductClass: UniqueType;
    let ProductClassSystem: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        ProductClass = testHelper.createUniqueType("ProductClass");
        ProductClassSystem = testHelper.createUniqueType("ProductClassSystem");

        const typeDefs = /* GraphQL */ `
            type ${ProductClass}
                @mutation(operations: [CREATE, DELETE, UPDATE])
                @authorization(
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_UPDATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [CREATE_RELATIONSHIP]
                            when: [AFTER]
                            where: { node: { _hasAccess_CREATE_RELATIONSHIP: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            when: [BEFORE]
                            where: { node: { _hasAccess_DELETE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE_RELATIONSHIP]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_DELETE_RELATIONSHIP: { eq: true } } }
                        }
                    ]
                )
                @node
                @subscription(events: []) {
                _hasAccess_CREATE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @filterable(byValue: true, byAggregate: false)
                    @sortable(byValue: false)
                    @cypher(
                        statement: """
                        RETURN COALESCE(
                        	(
                        		this.createdByApiUserName = 'test'
                        	),
                        	false
                        )
                        AS result
                        """
                        columnName: "result"
                    )
                _hasAccess_DELETE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @filterable(byValue: true, byAggregate: false)
                    @sortable(byValue: false)
                    @cypher(
                        statement: """
                        RETURN COALESCE(
                        	(
                        		this.createdByApiUserName = 'test'
                        	),
                        	false
                        )
                        AS result
                        """
                        columnName: "result"
                    )
                _hasAccess_DELETE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @filterable(byValue: true, byAggregate: false)
                    @sortable(byValue: false)
                    @cypher(
                        statement: """
                        RETURN COALESCE(
                        	(
                        		this.createdByApiUserName = 'test'
                        	),
                        	false
                        )
                        AS result
                        """
                        columnName: "result"
                    )
                _hasAccess_UPDATE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @filterable(byValue: true, byAggregate: false)
                    @sortable(byValue: false)
                    @cypher(
                        statement: """
                        RETURN COALESCE(
                        	(
                        		this.createdByApiUserName = 'test'
                        	),
                        	false
                        )
                        AS result
                        """
                        columnName: "result"
                    )

                createdByApiUserName: String
                id: Int
                productClassSystem: [${ProductClassSystem}!]!
                    @relationship(
                        type: "PRODUCTCLASSSYSTEM_HAS_PRODUCTCLASS"
                        direction: IN
                        nestedOperations: [CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
            }

            type ${ProductClassSystem}
                @mutation(operations: [UPDATE])
                @authorization(
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [DELETE_RELATIONSHIP]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_DELETE_RELATIONSHIP: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [CREATE_RELATIONSHIP]
                            when: [AFTER]
                            where: { node: { _hasAccess_CREATE_RELATIONSHIP: { eq: true } } }
                        }
                    ]
                )
                @node
                @subscription(events: []) {
                _hasAccess_CREATE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @filterable(byValue: true, byAggregate: false)
                    @sortable(byValue: false)
                    @cypher(
                        statement: """
                        RETURN COALESCE(
                        	(
                        			EXISTS {
                        				WITH this
                        				WHERE this.id IN [123, 456]
                        			}
                        	),
                        	false
                        )
                        AS result
                        """
                        columnName: "result"
                    )
                _hasAccess_DELETE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @filterable(byValue: true, byAggregate: false)
                    @sortable(byValue: false)
                    @cypher(
                        statement: """
                        RETURN COALESCE(
                        	(
                        			EXISTS {
                        				WITH this
                        				WHERE this.id IN [123, 456]
                        			}
                        	),
                        	false
                        )
                        AS result
                        """
                        columnName: "result"
                    )
                id: Int!
                productClasses: [${ProductClass}!]!
                    @relationship(
                        type: "PRODUCTCLASSSYSTEM_HAS_PRODUCTCLASS"
                        direction: OUT
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create node and relationship", async () => {
        const query = /* GraphQL */ `
           mutation {
                ${ProductClass.operations.create}(
                    input: [
                        {
                            id: 1
                            createdByApiUserName: "test"
                            productClassSystem: {
                                connect: [{ where: { node: { id: { eq: 123 } } } }]
                            }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                        relationshipsCreated
                    }
                }
           }
        `;

        await testHelper.executeCypher(`
            CREATE (:${ProductClassSystem} {id: 123})
        `);

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[ProductClass.operations.create]).toEqual({
            info: {
                nodesCreated: 1,
                relationshipsCreated: 1,
            },
        });

        await testHelper.expectNode(ProductClass).toEqual([
            {
                createdByApiUserName: "test",
                id: 1,
            },
        ]);
    });

    test("should throw", async () => {
        const query = /* GraphQL */ `
           mutation {
                ${ProductClass.operations.create}(
                    input: [
                        {
                            id: 1
                            createdByApiUserName: "test"
                            productClassSystem: {
                                connect: [{ where: { node: { id: { eq: 1 } } } }]
                            }
                        }
                    ]
                ) {
                    info {
                        nodesCreated
                        relationshipsCreated
                    }
                }
           }
        `;

        await testHelper.executeCypher(`
            CREATE (:${ProductClassSystem} {id: 1})
        `);

        const result = await testHelper.executeGraphQL(query);

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });
});
