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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5497", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type User
                @node
                @authorization(
                    validate: [
                        { operations: [CREATE, DELETE], where: { jwt: { roles_INCLUDES: "admin" } } }
                        { operations: [READ, UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }
                    ]
                    filter: [{ where: { node: { id_EQ: "$jwt.sub" } } }]
                ) {
                id: ID!
                cabinets: [Cabinet!]! @relationship(type: "HAS_CABINET", direction: OUT)
            }

            type Cabinet @authorization(filter: [{ where: { node: { user: { id_EQ: "$jwt.sub" } } } }]) @node {
                id: ID! @id
                categories: [Category!]! @relationship(type: "HAS_CATEGORY", direction: OUT)
                user: User! @relationship(type: "HAS_CABINET", direction: IN)
            }

            type Category
                @authorization(filter: [{ where: { node: { cabinet: { user: { id_EQ: "$jwt.sub" } } } } }])
                @node {
                id: ID! @id
                files: [File!]! @relationship(type: "HAS_FILE", direction: OUT)
                cabinet: Cabinet! @relationship(type: "HAS_CATEGORY", direction: IN)
            }

            type File @node {
                id: ID! @unique
                category: Category @relationship(type: "HAS_FILE", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should properly add where filters for auth", async () => {
        const query = /* GraphQL */ `
            mutation ($fileId: ID!, $newCategoryId: ID) {
                updateFiles(
                    where: { id_EQ: $fileId }
                    update: {
                        category: {
                            disconnect: { where: { node: { NOT: { id_EQ: $newCategoryId } } } }
                            connect: { where: { node: { id_EQ: $newCategoryId } } }
                        }
                    }
                ) {
                    info {
                        relationshipsDeleted
                        relationshipsCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                fileId: "old-id",
                newCategoryId: "new-id",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:File)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_category0_disconnect0_rel:HAS_FILE]-(this_category0_disconnect0:Category)
            CALL {
                WITH this_category0_disconnect0
                MATCH (this_category0_disconnect0)<-[:HAS_CATEGORY]-(authorization__before_this1:Cabinet)
                OPTIONAL MATCH (authorization__before_this1)<-[:HAS_CABINET]-(authorization__before_this2:User)
                WITH *, count(authorization__before_this2) AS userCount
                WITH *
                WHERE (userCount <> 0 AND ($jwt.sub IS NOT NULL AND authorization__before_this2.id = $jwt.sub))
                RETURN count(authorization__before_this1) = 1 AS authorization__before_var0
            }
            WITH *
            WHERE NOT (this_category0_disconnect0.id = $updateFiles_args_update_category_disconnect_where_Category_this_category0_disconnect0param0) AND ($isAuthenticated = true AND authorization__before_var0 = true)
            CALL {
            	WITH this_category0_disconnect0, this_category0_disconnect0_rel, this
            	WITH collect(this_category0_disconnect0) as this_category0_disconnect0, this_category0_disconnect0_rel, this
            	UNWIND this_category0_disconnect0 as x
            	DELETE this_category0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_category0_disconnect_Category
            }
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_category0_connect0_node:Category)
            CALL {
                WITH this_category0_connect0_node
                MATCH (this_category0_connect0_node)<-[:HAS_CATEGORY]-(authorization__before_this1:Cabinet)
                OPTIONAL MATCH (authorization__before_this1)<-[:HAS_CABINET]-(authorization__before_this2:User)
                WITH *, count(authorization__before_this2) AS userCount
                WITH *
                WHERE (userCount <> 0 AND ($jwt.sub IS NOT NULL AND authorization__before_this2.id = $jwt.sub))
                RETURN count(authorization__before_this1) = 1 AS authorization__before_var0
            }
            WITH *
            	WHERE this_category0_connect0_node.id = $this_category0_connect0_node_param0 AND ($isAuthenticated = true AND authorization__before_var0 = true)
            	CALL {
            		WITH *
            		WITH collect(this_category0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_category0_connect0_node
            			MERGE (this)<-[:HAS_FILE]-(this_category0_connect0_node)
            		}
            	}
            WITH this, this_category0_connect0_node
            	RETURN count(*) AS connect_this_category0_connect_Category0
            }
            WITH *
            CALL {
            	WITH this
            	MATCH (this)<-[this_category_Category_unique:HAS_FILE]-(:Category)
            	WITH count(this_category_Category_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDFile.category must be less than or equal to one', [0])
            	RETURN c AS this_category_Category_unique_ignored
            }
            RETURN \\"Query cannot conclude with CALL\\""
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"old-id\\",
                \\"updateFiles_args_update_category_disconnect_where_Category_this_category0_disconnect0param0\\": \\"new-id\\",
                \\"isAuthenticated\\": false,
                \\"jwt\\": {},
                \\"this_category0_connect0_node_param0\\": \\"new-id\\",
                \\"updateFiles\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"category\\": {
                                \\"connect\\": {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id_EQ\\": \\"new-id\\"
                                        }
                                    },
                                    \\"overwrite\\": true
                                },
                                \\"disconnect\\": {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"NOT\\": {
                                                \\"id_EQ\\": \\"new-id\\"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
