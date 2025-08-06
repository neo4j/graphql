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

describe("https://github.com/neo4j/graphql/issues/6031", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type Series implements Production @node {
                title: String!
            }

            type Movie implements Production @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor @node {
                name: String!
                ratings: [Int!]!
                lastRating: Int
                productions: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                year: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Top-level connection typename filtering", async () => {
        const query = /* GraphQL */ `
            query {
                productionsConnection(where: { typename: [Movie] }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL () {
                CALL () {
                    MATCH (this0:Series)
                    WHERE this0:Movie
                    WITH { node: { __resolveType: \\"Series\\", __id: id(this0), title: this0.title } } AS edge
                    RETURN edge
                    UNION
                    MATCH (this1:Movie)
                    WHERE this1:Movie
                    WITH { node: { __resolveType: \\"Movie\\", __id: id(this1), title: this1.title } } AS edge
                    RETURN edge
                }
                RETURN collect(edge) AS edges
            }
            WITH edges
            WITH edges, size(edges) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested-level connection typename filtering", async () => {
        const query = /* GraphQL */ `
            query {
                actorsConnection {
                    edges {
                        node {
                            name
                            productionsConnection(where: { node: { typename: [Movie] } }) {
                                edges {
                                    node {
                                        title
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
            "CYPHER 5
            MATCH (this0:Actor)
            WITH collect({ node: this0 }) AS edges
            CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL (this0) {
                    CALL (this0) {
                        CALL (this0) {
                            WITH this0
                            MATCH (this0)-[this1:ACTED_IN]->(this2:Series)
                            WHERE this2:Movie
                            WITH { node: { __resolveType: \\"Series\\", __id: id(this2), title: this2.title } } AS edge
                            RETURN edge
                            UNION
                            WITH this0
                            MATCH (this0)-[this3:ACTED_IN]->(this4:Movie)
                            WHERE this4:Movie
                            WITH { node: { __resolveType: \\"Movie\\", __id: id(this4), title: this4.title } } AS edge
                            RETURN edge
                        }
                        RETURN collect(edge) AS edges
                    }
                    WITH edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var5
                }
                RETURN collect({ node: { name: this0.name, productionsConnection: var5, __resolveType: \\"Actor\\" } }) AS var6
            }
            RETURN { edges: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
