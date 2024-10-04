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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Interface Relationships", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
            }

            type Series implements Production @node {
                title: String!
                episodes: Int!
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
                name: String!
                currentlyActingIn: Production @relationship(type: "CURRENTLY_ACTING_IN", direction: OUT)
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Interface Relationship Query", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    actedIn {
                        title
                        ... on Movie {
                            runtime
                        }
                        ... on Series {
                            episodes
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
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WITH this1 { .title, .runtime, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    WITH this4 { .title, .episodes, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple Interface Relationship Query For Non-Array Field", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    currentlyActingIn {
                        title
                        ... on Movie {
                            runtime
                        }
                        ... on Series {
                            episodes
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
                    WITH *
                    MATCH (this)-[this0:CURRENTLY_ACTING_IN]->(this1:Movie)
                    WITH this1 { .title, .runtime, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:CURRENTLY_ACTING_IN]->(this4:Series)
                    WITH this4 { .title, .episodes, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN head(collect(var2)) AS var2
            }
            RETURN this { currentlyActingIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple Interface Relationship Query with offset and limit", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    actedIn(offset: 5, limit: 10, sort: [{ title: DESC }]) {
                        title
                        ... on Movie {
                            runtime
                        }
                        ... on Series {
                            episodes
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
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    WITH this1 { .title, .runtime, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    WITH this4 { .title, .episodes, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                ORDER BY var2.title DESC
                SKIP $param0
                LIMIT $param1
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 5,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Interface Relationship Query through connection", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    actedInConnection {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
                                }
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
                    WITH { properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { __resolveType: \\"Movie\\", __id: id(this1), runtime: this1.runtime, title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    WITH { properties: { screenTime: this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { __resolveType: \\"Series\\", __id: id(this3), episodes: this3.episodes, title: this3.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { actedInConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Interface Relationship Query through connection with where", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    actedInConnection(where: { node: { title_STARTS_WITH: "The " }, edge: { screenTime_GT: 60 } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                                ... on Series {
                                    episodes
                                }
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
                    WHERE (this1.title STARTS WITH $param0 AND this0.screenTime > $param1)
                    WITH { properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { __resolveType: \\"Movie\\", __id: id(this1), runtime: this1.runtime, title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    WHERE (this3.title STARTS WITH $param2 AND this2.screenTime > $param3)
                    WITH { properties: { screenTime: this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { __resolveType: \\"Series\\", __id: id(this3), episodes: this3.episodes, title: this3.title } } AS edge
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
                \\"param0\\": \\"The \\",
                \\"param1\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"param2\\": \\"The \\",
                \\"param3\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
