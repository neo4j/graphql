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
                relatedId: ID @cypher(statement: "MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id")
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
            WHERE this.current = $param0
            WITH *, apoc.cypher.runFirstColumnSingle(\\"MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id\\", {this: this, auth: $auth}) AS relatedId
            ORDER BY relatedId ASC
            SKIP $this_offset
            LIMIT $this_limit
            CALL apoc.util.validate(NOT ((any(auth_var1 IN [\\"ALL\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id\\", {this: this, auth: $auth}) AS this_relatedId
                RETURN this_relatedId AS this_relatedId
            }
            CALL {
                WITH this
                MATCH (this)-[this_connection_nameDetailsConnectionthis0:HAS_NAME]->(this_NameDetails:\`NameDetails\`)
                WHERE apoc.util.validatePredicate(NOT ((any(this_connection_nameDetailsConnectionvar2 IN [\\"ALL\\"] WHERE any(this_connection_nameDetailsConnectionvar1 IN $auth.roles WHERE this_connection_nameDetailsConnectionvar1 = this_connection_nameDetailsConnectionvar2)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH { node: { fullName: this_NameDetails.fullName } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS nameDetailsConnection
            }
            CALL {
                WITH this
                MATCH (this)-[this_connection_marketsConnectionthis0:HAS_MARKETS]->(this_Market:\`Market\`)
                WHERE apoc.util.validatePredicate(NOT ((any(this_connection_marketsConnectionvar2 IN [\\"ALL\\"] WHERE any(this_connection_marketsConnectionvar1 IN $auth.roles WHERE this_connection_marketsConnectionvar1 = this_connection_marketsConnectionvar2)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this_Market
                    MATCH (this_Market)-[this_Market_connection_nameDetailsConnectionthis0:HAS_NAME]->(this_Market_NameDetails:\`NameDetails\`)
                    WHERE apoc.util.validatePredicate(NOT ((any(this_Market_connection_nameDetailsConnectionvar2 IN [\\"ALL\\"] WHERE any(this_Market_connection_nameDetailsConnectionvar1 IN $auth.roles WHERE this_Market_connection_nameDetailsConnectionvar1 = this_Market_connection_nameDetailsConnectionvar2)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH { node: { fullName: this_Market_NameDetails.fullName } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS nameDetailsConnection
                }
                WITH { node: { nameDetailsConnection: nameDetailsConnection } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS marketsConnection
            }
            CALL {
                WITH this
                MATCH (this)<-[this_connection_baseObjectConnectionthis0:HAS_BASE]-(this_BaseObject:\`BaseObject\`)
                WHERE apoc.util.validatePredicate(NOT ((any(this_connection_baseObjectConnectionvar2 IN [\\"ALL\\"] WHERE any(this_connection_baseObjectConnectionvar1 IN $auth.roles WHERE this_connection_baseObjectConnectionvar1 = this_connection_baseObjectConnectionvar2)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH { node: { id: this_BaseObject.id } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS baseObjectConnection
            }
            RETURN this { relatedId: this_relatedId, nameDetailsConnection: nameDetailsConnection, marketsConnection: marketsConnection, baseObjectConnection: baseObjectConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"this_offset\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"this_limit\\": {
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
