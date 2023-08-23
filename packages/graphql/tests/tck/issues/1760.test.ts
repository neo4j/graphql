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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/1760", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            interface BusinessObject {
                id: ID!
                nameDetails: NameDetails
            }

            type ApplicationVariant implements BusinessObject
                @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "ALL" } } }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                markets: [Market!]! @relationship(type: "HAS_MARKETS", direction: OUT)
                id: ID! @unique
                relatedId: ID
                    @cypher(statement: "MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id as res", columnName: "res")
                baseObject: BaseObject! @relationship(type: "HAS_BASE", direction: IN)
                current: Boolean!
                nameDetails: NameDetails @relationship(type: "HAS_NAME", direction: OUT)
            }

            type NameDetails
                @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "ALL" } } }])
                @exclude(operations: [CREATE, READ, UPDATE, DELETE]) {
                fullName: String!
            }

            type Market implements BusinessObject
                @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "ALL" } } }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID! @unique
                nameDetails: NameDetails @relationship(type: "HAS_NAME", direction: OUT)
            }

            type BaseObject
                @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "ALL" } } }])
                @exclude(operations: [CREATE, UPDATE, DELETE]) {
                id: ID! @id @unique
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
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
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:ApplicationVariant)
            WITH *
            WHERE (this.current = $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param2 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id as res
                }
                UNWIND res AS this0
                RETURN head(collect(this0)) AS this0
            }
            WITH *
            ORDER BY this0 ASC
            SKIP $param4
            LIMIT $param5
            CALL {
                WITH this
                MATCH (this)-[this1:HAS_NAME]->(this2:NameDetails)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param6 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH { node: { fullName: this2.fullName } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            CALL {
                WITH this
                MATCH (this)-[this4:HAS_MARKETS]->(this5:Market)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param7 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this5
                    MATCH (this5:Market)-[this6:HAS_NAME]->(this7:NameDetails)
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param8 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH { node: { fullName: this7.fullName } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var8
                }
                WITH { node: { nameDetailsConnection: var8 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var9
            }
            CALL {
                WITH this
                MATCH (this)<-[this10:HAS_BASE]-(this11:BaseObject)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $param9 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH { node: { id: this11.id } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var12
            }
            RETURN this { relatedId: this0, nameDetailsConnection: var3, marketsConnection: var9, baseObjectConnection: var12 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"isAuthenticated\\": true,
                \\"param2\\": \\"ALL\\",
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param4\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param5\\": {
                    \\"low\\": 50,
                    \\"high\\": 0
                },
                \\"param6\\": \\"ALL\\",
                \\"param7\\": \\"ALL\\",
                \\"param8\\": \\"ALL\\",
                \\"param9\\": \\"ALL\\"
            }"
        `);
    });
});
