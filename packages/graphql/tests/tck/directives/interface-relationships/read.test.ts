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

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Interface Relationships", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Production {
                title: String!
            }

            type Movie implements Production {
                title: String!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                currentlyActingIn: Production @relationship(type: "CURRENTLY_ACTING_IN", direction: OUT)
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Simple Interface Relationship Query", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
                    WITH this1 { __resolveType: \\"Movie\\", __id: id(this), .runtime, .title } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:\`Series\`)
                    WITH this4 { __resolveType: \\"Series\\", __id: id(this), .episodes, .title } AS this4
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
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:CURRENTLY_ACTING_IN]->(this1:\`Movie\`)
                    WITH this1 { __resolveType: \\"Movie\\", __id: id(this), .runtime, .title } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:CURRENTLY_ACTING_IN]->(this4:\`Series\`)
                    WITH this4 { __resolveType: \\"Series\\", __id: id(this), .episodes, .title } AS this4
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
        const query = gql`
            query {
                actors {
                    actedIn(options: { offset: 5, limit: 10, sort: [{ title: DESC }] }) {
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
                    WITH this1 { __resolveType: \\"Movie\\", __id: id(this), .runtime, .title } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:\`Series\`)
                    WITH this4 { __resolveType: \\"Series\\", __id: id(this), .episodes, .title } AS this4
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

    test("Type filtering using onType", async () => {
        const query = gql`
            query {
                actors {
                    actedIn(where: { _on: { Movie: { title_STARTS_WITH: "The " } } }) {
                        title
                        ... on Movie {
                            runtime
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
                    WHERE this1.title STARTS WITH $param0
                    WITH this1 { __resolveType: \\"Movie\\", __id: id(this), .runtime, .title } AS this1
                    RETURN this1 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The \\"
            }"
        `);
    });

    test("Filter overriding using onType", async () => {
        const query = gql`
            query {
                actors {
                    actedIn(where: { title_STARTS_WITH: "A ", _on: { Movie: { title_STARTS_WITH: "The " } } }) {
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
                    WHERE this1.title STARTS WITH $param0
                    WITH this1 { __resolveType: \\"Movie\\", __id: id(this), .runtime, .title } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]->(this4:\`Series\`)
                    WHERE this4.title STARTS WITH $param1
                    WITH this4 { __resolveType: \\"Series\\", __id: id(this), .episodes, .title } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The \\",
                \\"param1\\": \\"A \\"
            }"
        `);
    });

    test("Interface Relationship Query through connection", async () => {
        const query = gql`
            query {
                actors {
                    actedInConnection {
                        edges {
                            screenTime
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
                    WITH { screenTime: this0.screenTime, node: { __resolveType: \\"Movie\\", __id: id(this1), runtime: this1.runtime, title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:\`Series\`)
                    WITH { screenTime: this2.screenTime, node: { __resolveType: \\"Series\\", __id: id(this3), episodes: this3.episodes, title: this3.title } } AS edge
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
        const query = gql`
            query {
                actors {
                    actedInConnection(where: { node: { title_STARTS_WITH: "The " }, edge: { screenTime_GT: 60 } }) {
                        edges {
                            screenTime
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
                    WHERE (this0.screenTime > $param0 AND this1.title STARTS WITH $param1)
                    WITH { screenTime: this0.screenTime, node: { __resolveType: \\"Movie\\", __id: id(this1), runtime: this1.runtime, title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:\`Series\`)
                    WHERE (this2.screenTime > $param2 AND this3.title STARTS WITH $param3)
                    WITH { screenTime: this2.screenTime, node: { __resolveType: \\"Series\\", __id: id(this3), episodes: this3.episodes, title: this3.title } } AS edge
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
                \\"param0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"param1\\": \\"The \\",
                \\"param2\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"param3\\": \\"The \\"
            }"
        `);
    });

    test("Interface Relationship Query through connection with where excluding type", async () => {
        const query = gql`
            query {
                actors {
                    actedInConnection(
                        where: { node: { _on: { Movie: { title_STARTS_WITH: "The " } } }, edge: { screenTime_GT: 60 } }
                    ) {
                        edges {
                            screenTime
                            node {
                                title
                                ... on Movie {
                                    runtime
                                }
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
                    WHERE (this0.screenTime > $param0 AND this1.title STARTS WITH $param1)
                    WITH { screenTime: this0.screenTime, node: { __resolveType: \\"Movie\\", __id: id(this1), runtime: this1.runtime, title: this1.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var2
            }
            RETURN this { actedInConnection: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"param1\\": \\"The \\"
            }"
        `);
    });

    test("Interface Relationship Query through connection with where overriding", async () => {
        const query = gql`
            query {
                actors {
                    actedInConnection(
                        where: {
                            node: { title_STARTS_WITH: "The ", _on: { Movie: { title_STARTS_WITH: "A " } } }
                            edge: { screenTime_GT: 60 }
                        }
                    ) {
                        edges {
                            screenTime
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
                    WHERE (this0.screenTime > $param0 AND this1.title STARTS WITH $param1)
                    WITH { screenTime: this0.screenTime, node: { __resolveType: \\"Movie\\", __id: id(this1), runtime: this1.runtime, title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:\`Series\`)
                    WHERE (this2.screenTime > $param2 AND this3.title STARTS WITH $param3)
                    WITH { screenTime: this2.screenTime, node: { __resolveType: \\"Series\\", __id: id(this3), episodes: this3.episodes, title: this3.title } } AS edge
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
                \\"param0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"param1\\": \\"A \\",
                \\"param2\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"param3\\": \\"The \\"
            }"
        `);
    });
});
