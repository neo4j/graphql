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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/1150", () => {
    test("union types with auth and connection-where", async () => {
        const secret = "secret";

        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            type Battery {
                id: ID! @unique
                current: Boolean!
            }

            extend type Battery @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }])

            type CombustionEngine {
                id: ID! @unique
                current: Boolean!
            }

            type Drive {
                id: ID! @unique
                current: Boolean!
                driveCompositions: [DriveComposition!]!
                    @relationship(type: "CONSISTS_OF", properties: "RelationProps", direction: OUT)
            }

            union DriveComponent = Battery | CombustionEngine

            type DriveComposition {
                id: ID! @unique
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
            features: { authorization: { key: secret } },
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

        const token = createBearerToken(secret, { roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Drive)
            WHERE this.current = $param0
            CALL {
                WITH this
                MATCH (this)-[this0:CONSISTS_OF]->(this1:DriveComposition)
                WHERE this0.current = $param1
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        MATCH (this1:DriveComposition)-[this2:HAS]->(this3:Battery)
                        WHERE (this2.current = $param2 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param4 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                        WITH { current: this2.current, node: { __resolveType: \\"Battery\\", __id: id(this3), id: this3.id } } AS edge
                        RETURN edge
                        UNION
                        WITH this1
                        MATCH (this1:DriveComposition)-[this4:HAS]->(this5:CombustionEngine)
                        WHERE this4.current = $param6
                        WITH { current: this4.current, node: { __resolveType: \\"CombustionEngine\\", __id: id(this5), id: this5.id } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var6
                }
                WITH { node: { driveComponentConnection: var6 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var7
            }
            RETURN this { .current, driveCompositionsConnection: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": true,
                \\"param2\\": true,
                \\"isAuthenticated\\": true,
                \\"param4\\": \\"admin\\",
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ]
                },
                \\"param6\\": true
            }"
        `);
    });
});
