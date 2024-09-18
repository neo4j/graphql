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

describe("Top level interface connections", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Show {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Show @node {
                title: String!
                cost: Float
                runtime: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Show @node {
                title: String!
                episodes: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor @node {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Top level connection", async () => {
        const query = /* GraphQL */ `
            query {
                showsConnection(where: { title_EQ: "The Matrix" }) {
                    edges {
                        node {
                            title
                            ... on Movie {
                                cost
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE this0.title = $param0
                WITH { node: { __resolveType: \\"Movie\\", __id: id(this0), cost: this0.cost, title: this0.title } } AS edge
                RETURN edge
                UNION
                MATCH (this1:Series)
                WHERE this1.title = $param1
                WITH { node: { __resolveType: \\"Series\\", __id: id(this1), title: this1.title } } AS edge
                RETURN edge
            }
            WITH collect(edge) AS edges
            WITH edges, size(edges) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"The Matrix\\"
            }"
        `);
    });
    test("Top level connection with limit", async () => {
        const query = /* GraphQL */ `
            query {
                showsConnection(where: { title_EQ: "The Matrix" }, first: 2) {
                    edges {
                        node {
                            title
                            ... on Movie {
                                cost
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE this0.title = $param0
                WITH { node: { __resolveType: \\"Movie\\", __id: id(this0), cost: this0.cost, title: this0.title } } AS edge
                RETURN edge
                UNION
                MATCH (this1:Series)
                WHERE this1.title = $param1
                WITH { node: { __resolveType: \\"Series\\", __id: id(this1), title: this1.title } } AS edge
                RETURN edge
            }
            WITH collect(edge) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge
                LIMIT $param2
                RETURN collect(edge) AS var2
            }
            RETURN { edges: var2, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"The Matrix\\",
                \\"param2\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
