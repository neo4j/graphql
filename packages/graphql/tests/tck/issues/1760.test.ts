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
                @mutation(operations: []) {
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
                @mutation(operations: [])
                @query(read: false, aggregate: false) {
                fullName: String!
            }

            type Market implements BusinessObject
                @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "ALL" } } }])
                @mutation(operations: []) {
                id: ID! @unique
                nameDetails: NameDetails @relationship(type: "HAS_NAME", direction: OUT)
            }

            type BaseObject
                @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "ALL" } } }])
                @mutation(operations: []) {
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
            WHERE (this.current = $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:HAS_BASE]-(n:BaseObject) RETURN n.id as res
                }
                WITH res AS this0
                RETURN this0 AS var1
            }
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
            SKIP $param4
            LIMIT $param5
            CALL {
                WITH this
                MATCH (this)-[this3:HAS_NAME]->(this4:NameDetails)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this4, relationship: this3 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this4, edge.relationship AS this3
                    RETURN collect({ node: { fullName: this4.fullName, __resolveType: \\"NameDetails\\" } }) AS var5
                }
                RETURN { edges: var5, totalCount: totalCount } AS var6
            }
            CALL {
                WITH this
                MATCH (this)-[this7:HAS_MARKETS]->(this8:Market)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this8, relationship: this7 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this8, edge.relationship AS this7
                    CALL {
                        WITH this8
                        MATCH (this8)-[this9:HAS_NAME]->(this10:NameDetails)
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH collect({ node: this10, relationship: this9 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this10, edge.relationship AS this9
                            RETURN collect({ node: { fullName: this10.fullName, __resolveType: \\"NameDetails\\" } }) AS var11
                        }
                        RETURN { edges: var11, totalCount: totalCount } AS var12
                    }
                    RETURN collect({ node: { nameDetailsConnection: var12, __resolveType: \\"Market\\" } }) AS var13
                }
                RETURN { edges: var13, totalCount: totalCount } AS var14
            }
            CALL {
                WITH this
                MATCH (this)<-[this15:HAS_BASE]-(this16:BaseObject)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this16, relationship: this15 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this16, edge.relationship AS this15
                    RETURN collect({ node: { id: this16.id, __resolveType: \\"BaseObject\\" } }) AS var17
                }
                RETURN { edges: var17, totalCount: totalCount } AS var18
            }
            RETURN this { relatedId: this2, nameDetailsConnection: var6, marketsConnection: var14, baseObjectConnection: var18 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param3\\": \\"ALL\\",
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
