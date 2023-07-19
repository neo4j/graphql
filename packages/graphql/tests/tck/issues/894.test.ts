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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/894", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                id: ID! @id @alias(property: "_id")
                name: String!
                activeOrganization: Organization @relationship(type: "ACTIVELY_MANAGING", direction: OUT)
            }

            type Organization {
                id: ID! @id @alias(property: "_id")
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Disconnect and connect", async () => {
        const query = gql`
            mutation SwapSides {
                updateUsers(
                    where: { name: "Luke Skywalker" }
                    connect: { activeOrganization: { where: { node: { id: "test-id" } } } }
                    disconnect: { activeOrganization: { where: { node: { id_NOT: "test-id" } } } }
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
            OPTIONAL MATCH (this)-[this_disconnect_activeOrganization0_rel:ACTIVELY_MANAGING]->(this_disconnect_activeOrganization0:Organization)
            WHERE NOT (this_disconnect_activeOrganization0._id = $updateUsers_args_disconnect_activeOrganization_where_Organization_this_disconnect_activeOrganization0param0)
            CALL {
            	WITH this_disconnect_activeOrganization0, this_disconnect_activeOrganization0_rel, this
            	WITH collect(this_disconnect_activeOrganization0) as this_disconnect_activeOrganization0, this_disconnect_activeOrganization0_rel, this
            	UNWIND this_disconnect_activeOrganization0 as x
            	DELETE this_disconnect_activeOrganization0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_activeOrganization_Organization
            }
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_activeOrganization0_node:Organization)
            	WHERE this_connect_activeOrganization0_node._id = $this_connect_activeOrganization0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_activeOrganization0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_activeOrganization0_node
            			MERGE (this)-[:ACTIVELY_MANAGING]->(this_connect_activeOrganization0_node)
            		}
            	}
            WITH this, this_connect_activeOrganization0_node
            	RETURN count(*) AS connect_this_connect_activeOrganization_Organization
            }
            WITH *
            WITH *
            CALL {
            	WITH this
            	MATCH (this)-[this_activeOrganization_Organization_unique:ACTIVELY_MANAGING]->(:Organization)
            	WITH count(this_activeOrganization_Organization_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDUser.activeOrganization must be less than or equal to one', [0])
            	RETURN c AS this_activeOrganization_Organization_unique_ignored
            }
            RETURN collect(DISTINCT this { id: this._id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Luke Skywalker\\",
                \\"updateUsers_args_disconnect_activeOrganization_where_Organization_this_disconnect_activeOrganization0param0\\": \\"test-id\\",
                \\"this_connect_activeOrganization0_node_param0\\": \\"test-id\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"activeOrganization\\": {
                                \\"where\\": {
                                    \\"node\\": {
                                        \\"id_NOT\\": \\"test-id\\"
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
