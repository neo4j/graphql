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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

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

            interface RelationProps {
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
            "MATCH (this:Drive)
            WHERE this.current = $this_current
            CALL {
            WITH this
            MATCH (this)-[this_consists_of_relationship:CONSISTS_OF]->(this_drivecomposition:DriveComposition)
            WHERE this_consists_of_relationship.current = $this_driveCompositionsConnection.args.where.edge.current
            CALL {
            WITH this_drivecomposition
            CALL {
            WITH this_drivecomposition
            MATCH (this_drivecomposition)-[this_drivecomposition_has_relationship:HAS]->(this_drivecomposition_Battery:Battery)
            WHERE this_drivecomposition_has_relationship.current = $this_driveCompositionsConnection.edges.node.driveComponentConnection.args.where.Battery.edge.current
            CALL apoc.util.validate(NOT((ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH { current: this_drivecomposition_has_relationship.current, node: { __resolveType: \\"Battery\\", id: this_drivecomposition_Battery.id } } AS edge
            RETURN edge
            UNION
            WITH this_drivecomposition
            MATCH (this_drivecomposition)-[this_drivecomposition_has_relationship:HAS]->(this_drivecomposition_CombustionEngine:CombustionEngine)
            WHERE this_drivecomposition_has_relationship.current = $this_driveCompositionsConnection.edges.node.driveComponentConnection.args.where.CombustionEngine.edge.current
            WITH { current: this_drivecomposition_has_relationship.current, node: { __resolveType: \\"CombustionEngine\\", id: this_drivecomposition_CombustionEngine.id } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges
            RETURN { edges: edges, totalCount: size(edges) } AS driveComponentConnection
            }
            WITH collect({ node: { driveComponentConnection: driveComponentConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS driveCompositionsConnection
            }
            RETURN this { .current, driveCompositionsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_current\\": true,
                \\"this_driveCompositionsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"edge\\": {
                                \\"current\\": true
                            }
                        }
                    },
                    \\"edges\\": {
                        \\"node\\": {
                            \\"driveComponentConnection\\": {
                                \\"args\\": {
                                    \\"where\\": {
                                        \\"Battery\\": {
                                            \\"edge\\": {
                                                \\"current\\": true
                                            }
                                        },
                                        \\"CombustionEngine\\": {
                                            \\"edge\\": {
                                                \\"current\\": true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
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
