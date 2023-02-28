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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1760", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface BusinessObject {
                id: ID! @id(autogenerate: false)
                nameDetails: NameDetails
            }

            type ApplicationVariant implements BusinessObject
                @auth(rules: [{ isAuthenticated: true, roles: ["ALL"] }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                markets: [Market!]! @relationship(type: "HAS_MARKETS", direction: OUT)
                id: ID! @id(autogenerate: false)
                relatedId: ID
                    @cypher(statement: "MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id as res", columnName: "res")
                baseObject: BaseObject! @relationship(type: "HAS_BASE", direction: IN)
                current: Boolean!
                nameDetails: NameDetails @relationship(type: "HAS_NAME", direction: OUT)
            }

            type NameDetails
                @auth(rules: [{ isAuthenticated: true, roles: ["ALL"] }])
                @exclude(operations: [CREATE, READ, UPDATE, DELETE]) {
                fullName: String!
            }

            type Market implements BusinessObject
                @auth(rules: [{ isAuthenticated: true, roles: ["ALL"] }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID! @id(autogenerate: false)
                nameDetails: NameDetails @relationship(type: "HAS_NAME", direction: OUT)
            }

            type BaseObject
                @auth(rules: [{ isAuthenticated: true, roles: ["ALL"] }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID! @id
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Cypher fields should be calculated early in query if needed for sort, sort applied after initial match", async () => {
        const query = gql`
            query getApplicationVariants($where: ApplicationVariantWhere, $options: ApplicationVariantOptions) {
                applicationVariants(where: $where, options: $options) {
                    relatedId
                    nameDetailsConnection {
                        edges {
                            node {
                                fullName
                            }
                        }
                    }
                    marketsConnection {
                        edges {
                            node {
                                nameDetailsConnection {
                                    edges {
                                        node {
                                            fullName
                                        }
                                    }
                                }
                            }
                        }
                    }
                    baseObjectConnection {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const variableValues = {
            where: {
                current: true,
            },
            options: {
                sort: {
                    relatedId: "ASC",
                },
                offset: 0,
                limit: 50,
            },
        };

        const result = await translateQuery(neoSchema, query, {
            variableValues,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`ApplicationVariant\`)
            WHERE (this.current = $param0 AND apoc.util.validatePredicate(NOT ((any(var1 IN [\\"ALL\\"] WHERE any(var0 IN $auth.roles WHERE var0 = var1)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id as res
                }
                UNWIND res AS this2
                RETURN head(collect(this2)) AS this2
            }
            WITH *
            ORDER BY this2 ASC
            SKIP $param2
            LIMIT $param3
            CALL {
                WITH this
                MATCH (this)-[this3:HAS_NAME]->(this4:\`NameDetails\`)
                WHERE apoc.util.validatePredicate(NOT ((any(var6 IN [\\"ALL\\"] WHERE any(var5 IN $auth.roles WHERE var5 = var6)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH { node: { fullName: this4.fullName } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var7
            }
            CALL {
                WITH this
                MATCH (this)-[this8:HAS_MARKETS]->(this9:\`Market\`)
                WHERE apoc.util.validatePredicate(NOT ((any(var11 IN [\\"ALL\\"] WHERE any(var10 IN $auth.roles WHERE var10 = var11)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this9
                    MATCH (this9:\`Market\`)-[this12:HAS_NAME]->(this13:\`NameDetails\`)
                    WHERE apoc.util.validatePredicate(NOT ((any(var15 IN [\\"ALL\\"] WHERE any(var14 IN $auth.roles WHERE var14 = var15)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH { node: { fullName: this13.fullName } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var16
                }
                WITH { node: { nameDetailsConnection: var16 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var17
            }
            CALL {
                WITH this
                MATCH (this)<-[this18:HAS_BASE]-(this19:\`BaseObject\`)
                WHERE apoc.util.validatePredicate(NOT ((any(var21 IN [\\"ALL\\"] WHERE any(var20 IN $auth.roles WHERE var20 = var21)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH { node: { id: this19.id } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var22
            }
            RETURN this { relatedId: this2, nameDetailsConnection: var7, marketsConnection: var17, baseObjectConnection: var22 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param2\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param3\\": {
                    \\"low\\": 50,
                    \\"high\\": 0
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});
