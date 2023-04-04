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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1132", () => {
    test("Auth CONNECT rules checked against correct property", async () => {
        const typeDefs = gql`
            type Source @auth(rules: [{ operations: [CONNECT], allow: { id: "$jwt.sub" } }]) {
                id: ID!
                targets: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT)
            }

            type Target {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: { auth: new Neo4jGraphQLAuthJWTPlugin({ secret: "secret" }) },
        });

        const query = gql`
            mutation {
                updateSources(connect: { targets: { where: { node: { id: 1 } } } }) {
                    sources {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Source\`)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_targets0_node:Target)
            	WHERE this_connect_targets0_node.id = $this_connect_targets0_node_param0
            	WITH this, this_connect_targets0_node
            	CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this_connect_targets0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_targets0_node
            			MERGE (this)-[:HAS_TARGET]->(this_connect_targets0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_targets0_node
            	RETURN count(*) AS connect_this_connect_targets_Target
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connect_targets0_node_param0\\": \\"1\\",
                \\"thisauth_param0\\": \\"1\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Auth DISCONNECT rules checked against correct property", async () => {
        const typeDefs = gql`
            type Source @auth(rules: [{ operations: [DISCONNECT], allow: { id: "$jwt.sub" } }]) {
                id: ID!
                targets: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT)
            }

            type Target {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: { auth: new Neo4jGraphQLAuthJWTPlugin({ secret: "secret" }) },
        });

        const query = gql`
            mutation {
                updateSources(disconnect: { targets: { where: { node: { id: 1 } } } }) {
                    sources {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Source\`)
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_targets0_rel:HAS_TARGET]->(this_disconnect_targets0:Target)
            WHERE this_disconnect_targets0.id = $updateSources_args_disconnect_targets0_where_Target_this_disconnect_targets0param0
            WITH this, this_disconnect_targets0, this_disconnect_targets0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_targets0, this_disconnect_targets0_rel, this
            	WITH collect(this_disconnect_targets0) as this_disconnect_targets0, this_disconnect_targets0_rel, this
            	UNWIND this_disconnect_targets0 as x
            	DELETE this_disconnect_targets0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_targets_Target
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateSources_args_disconnect_targets0_where_Target_this_disconnect_targets0param0\\": \\"1\\",
                \\"thisauth_param0\\": \\"1\\",
                \\"updateSources\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"targets\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"1\\"
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
