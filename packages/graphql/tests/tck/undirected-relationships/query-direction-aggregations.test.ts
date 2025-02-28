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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("QueryDirection in relationships aggregations", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    test("query connection with a DIRECTED relationship", async () => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DIRECTED)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query Users {
                users {
                    friendsConnection {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:FRIENDS_WITH]->(this1:User)
                    RETURN { nodes: count(DISTINCT this1) } AS var2
                }
                CALL {
                    WITH *
                    MATCH (this)-[this3:FRIENDS_WITH]->(this4:User)
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        RETURN collect({ node: { __id: id(this4), __resolveType: \\"User\\" } }) AS var5
                    }
                    RETURN var5, totalCount
                }
                RETURN { edges: var5, totalCount: totalCount, aggregate: { count: var2 } } AS var6
            }
            RETURN this { friendsConnection: var6 } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("query with a UNDIRECTED relationship", async () => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: UNDIRECTED)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query Users {
                users {
                    friendsConnection {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:FRIENDS_WITH]-(this1:User)
                    RETURN { nodes: count(DISTINCT this1) } AS var2
                }
                CALL {
                    WITH *
                    MATCH (this)-[this3:FRIENDS_WITH]-(this4:User)
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        RETURN collect({ node: { __id: id(this4), __resolveType: \\"User\\" } }) AS var5
                    }
                    RETURN var5, totalCount
                }
                RETURN { edges: var5, totalCount: totalCount, aggregate: { count: var2 } } AS var6
            }
            RETURN this { friendsConnection: var6 } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
