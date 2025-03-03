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

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4116", () => {
    const secret = "sssh!";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                id: ID!
                roles: [String!]!
            }

            type Family @node {
                id: ID! @id
                members: [Person!]! @relationship(type: "MEMBER_OF", direction: IN)
                creator: [User!]! @relationship(type: "CREATOR_OF", direction: IN)
            }

            type Person
                @node
                @authorization(
                    filter: [
                        {
                            where: {
                                node: { family: { some: { creator: { some: { roles: { includes: "plan:paid" } } } } } }
                            }
                        }
                    ]
                ) {
                id: ID! @id
                creator: [User!]! @relationship(type: "CREATOR_OF", direction: IN, nestedOperations: [CONNECT])
                family: [Family!]! @relationship(type: "MEMBER_OF", direction: OUT)
            }

            type JWT @jwt {
                roles: [String!]!
            }

            extend schema @authentication
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("should generate valid cypher on nested aggregation with combined rules", async () => {
        const query = /* GraphQL */ `
            query Family {
                families {
                    id
                    membersConnection {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;
        const token = createBearerToken(secret, { sub: "michel", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Family)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)<-[this0:MEMBER_OF]-(this1:Person)
                    WHERE ($isAuthenticated = true AND EXISTS {
                        MATCH (this1)-[:MEMBER_OF]->(this2:Family)
                        WHERE EXISTS {
                            MATCH (this2)<-[:CREATOR_OF]-(this3:User)
                            WHERE ($param1 IS NOT NULL AND $param1 IN this3.roles)
                        }
                    })
                    RETURN { nodes: count(DISTINCT this1) } AS var4
                }
                CALL {
                    WITH *
                    MATCH (this)<-[this5:MEMBER_OF]-(this6:Person)
                    WHERE ($isAuthenticated = true AND EXISTS {
                        MATCH (this6)-[:MEMBER_OF]->(this7:Family)
                        WHERE EXISTS {
                            MATCH (this7)<-[:CREATOR_OF]-(this8:User)
                            WHERE ($param2 IS NOT NULL AND $param2 IN this8.roles)
                        }
                    })
                    WITH collect({ node: this6, relationship: this5 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this6, edge.relationship AS this5
                        RETURN collect({ node: { __id: id(this6), __resolveType: \\"Person\\" } }) AS var9
                    }
                    RETURN var9, totalCount
                }
                RETURN { edges: var9, totalCount: totalCount, aggregate: { count: var4 } } AS var10
            }
            RETURN this { .id, membersConnection: var10 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"param1\\": \\"plan:paid\\",
                \\"param2\\": \\"plan:paid\\"
            }"
        `);
    });
});
