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
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/3888", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User {
                id: ID!
            }

            type Post @authorization(filter: [{ where: { node: { author: { id: "$jwt.sub" } } } }]) {
                title: String!
                content: String!
                author: User! @relationship(type: "AUTHORED", direction: IN)
            }
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

    test("should not add an authorization check for connects coming from create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createPosts(
                    input: [
                        { title: "Test1", content: "Test1", author: { connect: { where: { node: { id: "michel" } } } } }
                    ]
                ) {
                    posts {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "michel" });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Post)
            SET this0.title = $this0_title
            SET this0.content = $this0_content
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_author_connect0_node:User)
            	WHERE this0_author_connect0_node.id = $this0_author_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_author_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_author_connect0_node
            			MERGE (this0)<-[:AUTHORED]-(this0_author_connect0_node)
            		}
            	}
            WITH this0, this0_author_connect0_node
            	RETURN count(*) AS connect_this0_author_connect_User0
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)<-[this0_author_User_unique:AUTHORED]-(:User)
            	WITH count(this0_author_User_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.author required exactly once', [0])
            	RETURN c AS this0_author_User_unique_ignored
            }
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .title } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Test1\\",
                \\"this0_content\\": \\"Test1\\",
                \\"this0_author_connect0_node_param0\\": \\"michel\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
