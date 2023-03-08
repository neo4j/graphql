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

describe("https://github.com/neo4j/graphql/issues/1150", () => {
    test("union types with auth and connection-where", async () => {
        const secret = "secret";

        const typeDefs = gql`
            type Battery {
                id: ID! @id(autogenerate: false)
                current: Boolean!
            }

            extend type Battery @auth(rules: [{ isAuthenticated: true, roles: ["admin"] }])

            type CombustionEngine {
                id: ID! @id(autogenerate: false)
                current: Boolean!
            }

            type Drive {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                driveCompositions: [DriveComposition!]!
                    @relationship(type: "CONSISTS_OF", properties: "RelationProps", direction: OUT)
            }

            union DriveComponent = Battery | CombustionEngine

            type DriveComposition {
                id: ID! @id(autogenerate: false)
                current: Boolean!
                driveComponent: [DriveComponent!]!
                    @relationship(type: "HAS", properties: "RelationProps", direction: OUT)
            }

            interface RelationProps @relationshipProperties {
                current: Boolean!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });

        const query = gql`
            query getDrivesWithFilteredUnionType {
                drives(where: { current: true }) {
                    current
                    driveCompositionsConnection(where: { edge: { current: true } }) {
                        edges {
                            node {
                                driveComponentConnection(
                                    where: {
                                        Battery: { edge: { current: true } }
                                        CombustionEngine: { edge: { current: true } }
                                    }
                                ) {
                                    edges {
                                        current
                                        node {
                                            ... on Battery {
                                                id
                                            }
                                            ... on CombustionEngine {
                                                id
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest(secret, { roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Drive\`)
            WHERE this.current = $param0
            CALL {
                WITH this
                MATCH (this)-[this0:\`CONSISTS_OF\`]->(this1:\`DriveComposition\`)
                WHERE this0.current = $param1
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        MATCH (this1:\`DriveComposition\`)-[this2:\`HAS\`]->(this3:\`Battery\`)
                        WHERE (this2.current = $param2 AND apoc.util.validatePredicate(NOT ((any(var5 IN [\\"admin\\"] WHERE any(var4 IN $auth.roles WHERE var4 = var5)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                        WITH { current: this2.current, node: { __resolveType: \\"Battery\\", __id: id(this3), id: this3.id } } AS edge
                        RETURN edge
                        UNION
                        WITH this1
                        MATCH (this1:\`DriveComposition\`)-[this6:\`HAS\`]->(this7:\`CombustionEngine\`)
                        WHERE this6.current = $param4
                        WITH { current: this6.current, node: { __resolveType: \\"CombustionEngine\\", __id: id(this7), id: this7.id } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var8
                }
                WITH { node: { driveComponentConnection: var8 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var9
            }
            RETURN this { .current, driveCompositionsConnection: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": true,
                \\"param2\\": true,
                \\"param4\\": true,
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ]
                    }
                }
            }"
        `);
    });
});
