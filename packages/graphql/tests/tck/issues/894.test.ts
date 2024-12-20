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

describe("https://github.com/neo4j/graphql/issues/894", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                id: ID! @id @alias(property: "_id")
                name: String!
                activeOrganization: [Organization!]! @relationship(type: "ACTIVELY_MANAGING", direction: OUT)
            }

            type Organization @node {
                id: ID! @id @alias(property: "_id")
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Disconnect and connect", async () => {
        const query = /* GraphQL */ `
            mutation SwapSides {
                updateUsers(
                    where: { name_EQ: "Luke Skywalker" }
                    update: {
                        activeOrganization: {
                            connect: { where: { node: { id_EQ: "test-id" } } }
                            disconnect: { where: { node: { NOT: { id_EQ: "test-id" } } } }
                        }
                    }
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.name = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_activeOrganization0_disconnect0_rel:ACTIVELY_MANAGING]->(this_activeOrganization0_disconnect0:Organization)
            WHERE NOT (this_activeOrganization0_disconnect0._id = $updateUsers_args_update_activeOrganization0_disconnect0_where_Organization_this_activeOrganization0_disconnect0param0)
            CALL {
            	WITH this_activeOrganization0_disconnect0, this_activeOrganization0_disconnect0_rel, this
            	WITH collect(this_activeOrganization0_disconnect0) as this_activeOrganization0_disconnect0, this_activeOrganization0_disconnect0_rel, this
            	UNWIND this_activeOrganization0_disconnect0 as x
            	DELETE this_activeOrganization0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_activeOrganization0_disconnect_Organization
            }
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_activeOrganization0_connect0_node:Organization)
            	WHERE this_activeOrganization0_connect0_node._id = $this_activeOrganization0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_activeOrganization0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_activeOrganization0_connect0_node
            			MERGE (this)-[:ACTIVELY_MANAGING]->(this_activeOrganization0_connect0_node)
            		}
            	}
            WITH this, this_activeOrganization0_connect0_node
            	RETURN count(*) AS connect_this_activeOrganization0_connect_Organization0
            }
            RETURN collect(DISTINCT this { id: this._id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Luke Skywalker\\",
                \\"updateUsers_args_update_activeOrganization0_disconnect0_where_Organization_this_activeOrganization0_disconnect0param0\\": \\"test-id\\",
                \\"this_activeOrganization0_connect0_node_param0\\": \\"test-id\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"activeOrganization\\": [
                                {
                                    \\"connect\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id_EQ\\": \\"test-id\\"
                                                }
                                            }
                                        }
                                    ],
                                    \\"disconnect\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"NOT\\": {
                                                        \\"id_EQ\\": \\"test-id\\"
                                                    }
                                                }
                                            }
                                        }
                                    ]
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
