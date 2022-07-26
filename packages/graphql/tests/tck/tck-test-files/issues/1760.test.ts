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
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

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
            WITH this,  apoc.cypher.runFirstColumn(\\"MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id\\", {this: this, auth: $auth}, false) AS relatedId
            ORDER BY relatedId ASC
            SKIP $this_offset
            LIMIT $this_limit
            CALL apoc.util.validate(NOT ((any(r IN [\\"ALL\\"] WHERE any(rr IN $auth.roles WHERE r = rr)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            WITH this
            MATCH (this)-[this_has_name_relationship:HAS_NAME]->(this_namedetails:NameDetails)
            CALL apoc.util.validate(NOT ((any(r IN [\\"ALL\\"] WHERE any(rr IN $auth.roles WHERE r = rr)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH collect({ node: { fullName: this_namedetails.fullName } }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS nameDetailsConnection
            }
            CALL {
            WITH this
            MATCH (this)-[this_has_markets_relationship:HAS_MARKETS]->(this_market:Market)
            CALL apoc.util.validate(NOT ((any(r IN [\\"ALL\\"] WHERE any(rr IN $auth.roles WHERE r = rr)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            WITH this_market
            MATCH (this_market)-[this_market_has_name_relationship:HAS_NAME]->(this_market_namedetails:NameDetails)
            CALL apoc.util.validate(NOT ((any(r IN [\\"ALL\\"] WHERE any(rr IN $auth.roles WHERE r = rr)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH collect({ node: { fullName: this_market_namedetails.fullName } }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS nameDetailsConnection
            }
            WITH collect({ node: { nameDetailsConnection: nameDetailsConnection } }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS marketsConnection
            }
            CALL {
            WITH this
            MATCH (this)<-[this_has_base_relationship:HAS_BASE]-(this_baseobject:BaseObject)
            CALL apoc.util.validate(NOT ((any(r IN [\\"ALL\\"] WHERE any(rr IN $auth.roles WHERE r = rr)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH collect({ node: { id: this_baseobject.id } }) AS edges
            UNWIND edges as edge
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS baseObjectConnection
            }
            RETURN this { relatedId: relatedId, nameDetailsConnection, marketsConnection, baseObjectConnection } as this"
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
