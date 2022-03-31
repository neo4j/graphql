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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

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
            config: { enableRegex: true },
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.name = $this_name
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_activeOrganization0_node:Organization)
            	WHERE this_connect_activeOrganization0_node._id = $this_connect_activeOrganization0_node_id
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_activeOrganization0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:ACTIVELY_MANAGING]->(this_connect_activeOrganization0_node)
            		)
            	)
            	RETURN count(*)
            }
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_activeOrganization0_rel:ACTIVELY_MANAGING]->(this_disconnect_activeOrganization0:Organization)
            WHERE (NOT this_disconnect_activeOrganization0._id = $updateUsers.args.disconnect.activeOrganization.where.node.id_NOT)
            FOREACH(_ IN CASE this_disconnect_activeOrganization0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_activeOrganization0_rel
            )
            RETURN count(*)
            }
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_activeOrganization_Organization_unique:ACTIVELY_MANAGING]->(:Organization)
            	WITH count(this_activeOrganization_Organization_unique) as c
            	CALL apoc.util.validate(NOT(c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDUser.activeOrganization must be less than or equal to one', [0])
            	RETURN c AS this_activeOrganization_Organization_unique_ignored
            }
            RETURN collect(DISTINCT this { id: this._id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Luke Skywalker\\",
                \\"this_connect_activeOrganization0_node_id\\": \\"test-id\\",
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
