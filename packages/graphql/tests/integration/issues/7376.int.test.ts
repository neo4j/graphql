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

describe("https://github.com/neo4j/graphql/issues/7376", () => {
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

    test("should disconnect the relationship, applying the source authorization rule to the source node", async () => {
        await testHelper.executeCypher(`
            CREATE (:${ProductClassSystem} {id: 123})-[:PRODUCTCLASSSYSTEM_HAS_PRODUCTCLASS]->(:${ProductClass} {id: 1, createdByApiUserName: 'test'})
        `);

        const query = /* GraphQL */ `
            mutation {
                ${ProductClass.operations.update}(
                    where: { id: { eq: 1 } }
                    update: { productClassSystem: { disconnect: [{ where: { node: { id: { eq: 123 } } } }] } }
                ) {
                    info {
                        relationshipsDeleted
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[ProductClass.operations.update]).toEqual({
            info: {
                relationshipsDeleted: 1,
            },
        });
    });

    test("should disconnect the relationship when disconnecting from the other side", async () => {
        await testHelper.executeCypher(`
            CREATE (:${ProductClassSystem} {id: 456})-[:PRODUCTCLASSSYSTEM_HAS_PRODUCTCLASS]->(:${ProductClass} {id: 2, createdByApiUserName: 'test'})
        `);

        const query = /* GraphQL */ `
            mutation {
                ${ProductClassSystem.operations.update}(
                    where: { id: { eq: 456 } }
                    update: { productClasses: { disconnect: [{ where: { node: { id: { eq: 2 } } } }] } }
                ) {
                    info {
                        relationshipsDeleted
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[ProductClassSystem.operations.update]).toEqual({
            info: {
                relationshipsDeleted: 1,
            },
        });
    });

    test("should throw when the source node does not pass its own DELETE_RELATIONSHIP rule", async () => {
        await testHelper.executeCypher(`
            CREATE (:${ProductClassSystem} {id: 999})-[:PRODUCTCLASSSYSTEM_HAS_PRODUCTCLASS]->(:${ProductClass} {id: 3, createdByApiUserName: 'test'})
        `);

        const query = /* GraphQL */ `
            mutation {
                ${ProductClassSystem.operations.update}(
                    where: { id: { eq: 999 } }
                    update: { productClasses: { disconnect: [{ where: { node: { id: { eq: 3 } } } }] } }
                ) {
                    info {
                        relationshipsDeleted
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when the target node does not pass its own DELETE_RELATIONSHIP rule", async () => {
        await testHelper.executeCypher(`
            CREATE (:${ProductClassSystem} {id: 111})-[:PRODUCTCLASSSYSTEM_HAS_PRODUCTCLASS]->(:${ProductClass} {id: 4, createdByApiUserName: 'test'})
        `);

        const query = /* GraphQL */ `
            mutation {
                ${ProductClass.operations.update}(
                    where: { id: { eq: 4 } }
                    update: { productClassSystem: { disconnect: [{ where: { node: { id: { eq: 111 } } } }] } }
                ) {
                    info {
                        relationshipsDeleted
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should delete the node when the relationship is deleted implicitly by the node deletion", async () => {
        await testHelper.executeCypher(`
            CREATE (:${ProductClassSystem} {id: 123})-[:PRODUCTCLASSSYSTEM_HAS_PRODUCTCLASS]->(:${ProductClass} {id: 5, createdByApiUserName: 'test'})
        `);

        const query = /* GraphQL */ `
            mutation {
                ${ProductClass.operations.delete}(where: { id: { eq: 5 } }) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[ProductClass.operations.delete]).toEqual({
            nodesDeleted: 1,
            relationshipsDeleted: 1,
        });
    });
});
