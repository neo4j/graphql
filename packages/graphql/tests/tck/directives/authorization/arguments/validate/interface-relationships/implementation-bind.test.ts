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

import { Neo4jGraphQL } from "../../../../../../../src";
import { createBearerToken } from "../../../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../../../utils/tck-test-utils";

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Content {
                id: ID
                creator: [User!]! @declareRelationship
            }

            type Comment implements Content @node {
                id: ID
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type Post implements Content
                @node
                @authorization(
                    validate: [
                        {
                            when: AFTER
                            operations: [CREATE, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } }
                        }
                    ]
                ) {
                id: ID
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type User @node {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            extend type User
                @authorization(
                    validate: [
                        {
                            when: AFTER
                            operations: [CREATE, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { id: { eq: "$jwt.sub" } } }
                        }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("Create Nested Node with bind", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(
                    input: [
                        {
                            id: "user-id"
                            name: "bob"
                            content: {
                                create: [
                                    {
                                        node: {
                                            Post: {
                                                id: "post-id-1"
                                                creator: { create: { node: { id: "some-user-id" } } }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:User)
                SET
                    this0.id = $param0,
                    this0.name = $param1
                WITH *
                CREATE (this1:Post)
                WITH *
                CREATE (this2:User)
                MERGE (this1)<-[this3:HAS_CONTENT]-(this2)
                SET
                    this2.id = $param2
                MERGE (this0)-[this4:HAS_CONTENT]->(this1)
                SET
                    this1.id = $param3
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_CONTENT]-(this5:User)
                    WHERE ($jwt.sub IS NOT NULL AND this5.id = $jwt.sub)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var6
            }
            RETURN collect(var6) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"param1\\": \\"bob\\",
                \\"param2\\": \\"some-user-id\\",
                \\"param3\\": \\"post-id-1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });

    test("Create Nested Node without bind", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(
                    input: [
                        {
                            id: "user-id"
                            name: "bob"
                            content: {
                                create: [
                                    {
                                        node: {
                                            Comment: {
                                                id: "post-id-1"
                                                creator: { create: { node: { id: "some-user-id" } } }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:User)
                SET
                    this0.id = $param0,
                    this0.name = $param1
                WITH *
                CREATE (this1:Comment)
                WITH *
                CREATE (this2:User)
                MERGE (this1)<-[this3:HAS_CONTENT]-(this2)
                SET
                    this2.id = $param2
                MERGE (this0)-[this4:HAS_CONTENT]->(this1)
                SET
                    this1.id = $param3
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var5
            }
            RETURN collect(var5) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"param1\\": \\"bob\\",
                \\"param2\\": \\"some-user-id\\",
                \\"param3\\": \\"post-id-1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });

    test("Update Nested Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(
                    where: { id: { eq: "id-01" } }
                    update: {
                        content: {
                            update: {
                                where: { node: { id: { eq: "post-id" } } }
                                node: { creator: { update: { node: { id_SET: "not bound" } } } }
                            }
                        }
                    }
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WHERE this.id = $param0
            WITH this
            CALL (this) {
            WITH this
            CALL(*) {
            	WITH this
            	MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
            	WHERE this_content0.id = $updateUsers_args_update_content0_where_this_content0param0
            	WITH this, this_content0
            	CALL(*) {
            		WITH this, this_content0
            		MATCH (this_content0)<-[this_content0_has_content0_relationship:HAS_CONTENT]-(this_content0_creator0:User)
            		SET this_content0_creator0.id = $this_update_content0_creator0_id_SET
            		WITH this, this_content0, this_content0_creator0
            		WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this_content0_creator0.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            		RETURN count(*) AS update_this_content0_creator0
            	}
            	RETURN count(*) AS update_this_content0
            }
            RETURN count(*) AS update_this_Comment
            }
            CALL (this){
            	WITH this
            CALL(*) {
            	WITH this
            	MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Post)
            	WHERE this_content0.id = $updateUsers_args_update_content0_where_this_content0param0
            	WITH this, this_content0
            	CALL(*) {
            		WITH this, this_content0
            		MATCH (this_content0)<-[this_content0_has_content0_relationship:HAS_CONTENT]-(this_content0_creator0:User)
            		SET this_content0_creator0.id = $this_update_content0_creator0_id_SET
            		WITH this, this_content0, this_content0_creator0
            		WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this_content0_creator0.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            		RETURN count(*) AS update_this_content0_creator0
            	}
            	WITH this, this_content0
            	WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
            	    MATCH (this_content0)<-[:HAS_CONTENT]-(authorization__after_this0:User)
            	    WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub)
            	}), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	RETURN count(*) AS update_this_content0
            }
            RETURN count(*) AS update_this_Post
            }
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"updateUsers_args_update_content0_where_this_content0param0\\": \\"post-id\\",
                \\"this_update_content0_creator0_id_SET\\": \\"not bound\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"content\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"creator\\": [
                                                {
                                                    \\"update\\": {
                                                        \\"node\\": {
                                                            \\"id_SET\\": \\"not bound\\"
                                                        }
                                                    }
                                                }
                                            ]
                                        },
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"id\\": {
                                                    \\"eq\\": \\"post-id\\"
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
