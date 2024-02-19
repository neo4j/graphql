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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/1760", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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
        const query = /* GraphQL */ `
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
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this2, relationship: this1 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this2, edge.relationship AS this1
                    RETURN collect({ node: { fullName: this2.fullName, __resolveType: \\"NameDetails\\" } }) AS var3
                }
                RETURN { edges: var3, totalCount: totalCount } AS var4
            }
            CALL {
                WITH this
                MATCH (this)-[this5:HAS_MARKETS]->(this6:Market)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this6, relationship: this5 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this6, edge.relationship AS this5
                    CALL {
                        WITH this6
                        MATCH (this6)-[this7:HAS_NAME]->(this8:NameDetails)
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH collect({ node: this8, relationship: this7 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this8, edge.relationship AS this7
                            RETURN collect({ node: { fullName: this8.fullName, __resolveType: \\"NameDetails\\" } }) AS var9
                        }
                        RETURN { edges: var9, totalCount: totalCount } AS var10
                    }
                    RETURN collect({ node: { nameDetailsConnection: var10, __resolveType: \\"Market\\" } }) AS var11
                }
                RETURN { edges: var11, totalCount: totalCount } AS var12
            }
            CALL {
                WITH this
                MATCH (this)<-[this13:HAS_BASE]-(this14:BaseObject)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this14, relationship: this13 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this14, edge.relationship AS this13
                    RETURN collect({ node: { id: this14.id, __resolveType: \\"BaseObject\\" } }) AS var15
                }
                RETURN { edges: var15, totalCount: totalCount } AS var16
            }
            RETURN this { relatedId: this0, nameDetailsConnection: var4, marketsConnection: var12, baseObjectConnection: var16 } AS this"
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
