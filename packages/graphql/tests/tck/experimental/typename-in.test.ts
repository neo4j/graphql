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

describe("typename_IN", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                cost: Float!
            }

            type Movie implements Production {
                title: String!
                cost: Float!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                cost: Float!
                episodes: Int!
            }

            type Cartoon implements Production {
                title: String!
                cost: Float!
                cartoonist: String!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("top-level", async () => {
        const query = /* GraphQL */ `
            {
                productions(
                    where: {
                        OR: [{ AND: [{ title: "The Matrix" }, { typename_IN: [Series] }] }, { typename_IN: [Movie] }]
                    }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE ((this0.title = $param0 AND this0:Series) OR this0:Movie)
                WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Series)
                WHERE ((this1.title = $param1 AND this1:Series) OR this1:Movie)
                WITH this1 { .title, __resolveType: \\"Series\\", __id: id(this1) } AS this1
                RETURN this1 AS this
                UNION
                MATCH (this2:Cartoon)
                WHERE ((this2.title = $param2 AND this2:Series) OR this2:Movie)
                WITH this2 { .title, __resolveType: \\"Cartoon\\", __id: id(this2) } AS this2
                RETURN this2 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"The Matrix\\",
                \\"param2\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level + connection where", async () => {
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        actedInConnection_SOME: {
                            OR: [
                                { edge: { screenTime: 2 } }
                                { node: { OR: [{ title: "The Matrix" }, { typename_IN: [Series] }] } }
                            ]
                        }
                    }
                ) {
                    actedIn {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE EXISTS {
                MATCH (this)-[this0:ACTED_IN]->(this1)
                WHERE ((this0.screenTime = $param0 OR (this1.title = $param1 OR this1:Series)) AND (this1:Movie OR this1:Series OR this1:Cartoon))
            }
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                    WITH this3 { .title, __resolveType: \\"Movie\\", __id: id(this3) } AS this3
                    RETURN this3 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this5:ACTED_IN]->(this6:Series)
                    WITH this6 { .title, __resolveType: \\"Series\\", __id: id(this6) } AS this6
                    RETURN this6 AS var4
                    UNION
                    WITH *
                    MATCH (this)-[this7:ACTED_IN]->(this8:Cartoon)
                    WITH this8 { .title, __resolveType: \\"Cartoon\\", __id: id(this8) } AS this8
                    RETURN this8 AS var4
                }
                WITH var4
                RETURN collect(var4) AS var4
            }
            RETURN this { actedIn: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": \\"The Matrix\\"
            }"
        `);
    });

    test("nested", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedIn(
                        where: {
                            OR: [
                                { AND: [{ title: "The Matrix" }, { typename_IN: [Series] }] }
                                { typename_IN: [Movie] }
                            ]
                        }
                    ) {
                        title
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
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WHERE ((this1.title = $param0 AND this1:Series) OR this1:Movie)
                    WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    WHERE ((this4.title = $param1 AND this4:Series) OR this4:Movie)
                    WITH this4 { .title, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this5:ACTED_IN]->(this6:Cartoon)
                    WHERE ((this6.title = $param2 AND this6:Series) OR this6:Movie)
                    WITH this6 { .title, __resolveType: \\"Cartoon\\", __id: id(this6) } AS this6
                    RETURN this6 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"The Matrix\\",
                \\"param2\\": \\"The Matrix\\"
            }"
        `);
    });

    test("aggregation", async () => {
        const query = /* GraphQL */ `
            {
                productionsAggregate(where: { OR: [{ title: "the matrix" }, { typename_IN: [Movie, Series] }] }) {
                    count
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                    UNION
                    MATCH (this2:Cartoon)
                    RETURN this2 AS node
                }
                WITH *
                WHERE (node.title = $param0 OR (node:Movie OR node:Series))
                RETURN count(node) AS this3
            }
            RETURN { count: this3 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"the matrix\\"
            }"
        `);
    });

    test("nested aggregation", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    actedInAggregate(where: { typename_IN: [Movie, Series] }) {
                        count
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
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this4:ACTED_IN]->(this5:Cartoon)
                    RETURN this5 AS node, this4 AS edge
                }
                WITH *
                WHERE (node:Movie OR node:Series)
                RETURN count(node) AS this6
            }
            RETURN this { actedInAggregate: { count: this6 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
