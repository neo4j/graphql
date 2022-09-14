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
            "MATCH (this:\`Drive\`)
            WHERE this.current = $param0
            CALL {
                WITH this
                MATCH (this)-[this_connection_driveCompositionsConnectionthis0:CONSISTS_OF]->(this_DriveComposition:\`DriveComposition\`)
                WHERE this_connection_driveCompositionsConnectionthis0.current = $this_connection_driveCompositionsConnectionparam0
                CALL {
                    WITH this_DriveComposition
                    CALL {
                        WITH this_DriveComposition
                        MATCH (this_DriveComposition)-[this_DriveComposition_connection_driveComponentConnectionthis0:HAS]->(this_DriveComposition_Battery:\`Battery\`)
                        WHERE this_DriveComposition_connection_driveComponentConnectionthis0.current = $this_DriveComposition_connection_driveComponentConnectionparam0
                        RETURN { current: this_DriveComposition_connection_driveComponentConnectionthis0.current, node: { __resolveType: \\"Battery\\", id: this_DriveComposition_Battery.id } } AS edge
                        UNION
                        WITH this_DriveComposition
                        MATCH (this_DriveComposition)-[this_DriveComposition_connection_driveComponentConnectionthis1:HAS]->(this_DriveComposition_CombustionEngine:\`CombustionEngine\`)
                        WHERE this_DriveComposition_connection_driveComponentConnectionthis1.current = $this_DriveComposition_connection_driveComponentConnectionparam1
                        RETURN { current: this_DriveComposition_connection_driveComponentConnectionthis1.current, node: { __resolveType: \\"CombustionEngine\\", id: this_DriveComposition_CombustionEngine.id } } AS edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS driveComponentConnection
                }
                WITH collect({ node: { driveComponentConnection: driveComponentConnection } }) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS driveCompositionsConnection
            }
            RETURN this { .current, driveCompositionsConnection: driveCompositionsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"this_connection_driveCompositionsConnectionparam0\\": true,
                \\"this_DriveComposition_connection_driveComponentConnectionparam0\\": true,
                \\"this_DriveComposition_connection_driveComponentConnectionparam1\\": true
            }"
        `);
    });
});
