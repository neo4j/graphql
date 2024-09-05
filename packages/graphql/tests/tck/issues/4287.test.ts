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

describe("https://github.com/neo4j/graphql/issues/4287", () => {
    const typeDefs = /* GraphQL */ `
        type Actor @node {
            name: String
            actedIn: [Production!]! @relationship(type: "ACTED_IN", properties: "actedIn", direction: OUT)
        }
        type actedIn @relationshipProperties {
            role: String
        }
        interface Production {
            title: String
        }
        type Movie implements Production @node {
            title: String
            runtime: Int
        }
        type Series implements Production @node {
            title: String
            episodes: Int
        }
    `;

    test("filter by logical operator on interface connection", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            query {
                actors {
                    actedInConnection(
                        where: { OR: [{ node: { title: "something" } }, { node: { title: "whatever" } }] }
                    ) {
                        edges {
                            node {
                                __typename
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WHERE (this1.title = $param0 OR this1.title = $param1)
                    WITH { node: { __resolveType: \\"Movie\\", __id: id(this1), title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    WHERE (this3.title = $param2 OR this3.title = $param3)
                    WITH { node: { __resolveType: \\"Series\\", __id: id(this3), title: this3.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { actedInConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something\\",
                \\"param1\\": \\"whatever\\",
                \\"param2\\": \\"something\\",
                \\"param3\\": \\"whatever\\"
            }"
        `);
    });
});
