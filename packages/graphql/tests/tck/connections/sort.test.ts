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

describe("Relationship Properties Cypher", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                numberOfActors: Int!
                    @cypher(
                        statement: "MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count"
                        columnName: "count"
                    )
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
                year: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection(first: 5, sort: { title: ASC }) {
                    edges {
                        node {
                            title
                            actorsConnection {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                ORDER BY this0.title ASC
                LIMIT $param0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        RETURN collect({ node: { name: this2.name, __resolveType: \\"Actor\\" } }) AS var3
                    }
                    RETURN { edges: var3, totalCount: totalCount } AS var4
                }
                RETURN collect({ node: { title: this0.title, actorsConnection: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 5,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Sort by cypher fields", async () => {
        const query = /* GraphQL */ `
            query {
                moviesConnection(first: 2, sort: { title: DESC, numberOfActors: ASC }) {
                    edges {
                        node {
                            title
                            actorsConnection {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (actor:Actor)-[:ACTED_IN]->(this) RETURN count(actor) as count
                    }
                    WITH count AS this1
                    RETURN this1 AS var2
                }
                WITH *
                ORDER BY this0.title DESC, var2 ASC
                LIMIT $param0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this3:ACTED_IN]-(this4:Actor)
                    WITH collect({ node: this4, relationship: this3 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this4, edge.relationship AS this3
                        RETURN collect({ node: { name: this4.name, __resolveType: \\"Actor\\" } }) AS var5
                    }
                    RETURN { edges: var5, totalCount: totalCount } AS var6
                }
                RETURN collect({ node: { title: this0.title, actorsConnection: var6, __resolveType: \\"Movie\\" } }) AS var7
            }
            RETURN { edges: var7, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
