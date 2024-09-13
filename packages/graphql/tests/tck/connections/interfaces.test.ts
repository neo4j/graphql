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

describe("Cypher -> Connections -> Interfaces", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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

    test("Projecting interface node and relationship properties with no arguments", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    name
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
            RETURN this { .name, actedInConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Projecting interface node and relationship properties with common where argument", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    name
                    actedInConnection(where: { node: { title_STARTS_WITH: "The " } }) {
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
                    WHERE this1.title STARTS WITH $param0
                    WITH { properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { __resolveType: \\"Movie\\", __id: id(this1), runtime: this1.runtime, title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    WHERE this3.title STARTS WITH $param1
                    WITH { properties: { screenTime: this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { __resolveType: \\"Series\\", __id: id(this3), episodes: this3.episodes, title: this3.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { .name, actedInConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The \\",
                \\"param1\\": \\"The \\"
            }"
        `);
    });

    test("Projecting interface node and relationship properties with where relationship argument", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    name
                    actedInConnection(where: { edge: { screenTime_GT: 60 } }) {
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
                    WHERE this0.screenTime > $param0
                    WITH { properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { __resolveType: \\"Movie\\", __id: id(this1), runtime: this1.runtime, title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    WHERE this2.screenTime > $param1
                    WITH { properties: { screenTime: this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { __resolveType: \\"Series\\", __id: id(this3), episodes: this3.episodes, title: this3.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { .name, actedInConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    describe("Projecting interface node and relationship properties with sort argument", () => {
        describe("field in selection set", () => {
            test("on edge", async () => {
                const query = /* GraphQL */ `
                    query {
                        actors {
                            name
                            actedInConnection(sort: [{ edge: { screenTime: ASC } }]) {
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
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge
                            ORDER BY edge.properties.screenTime ASC
                            RETURN collect(edge) AS var4
                        }
                        RETURN { edges: var4, totalCount: totalCount } AS var5
                    }
                    RETURN this { .name, actedInConnection: var5 } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
            });

            test("on node", async () => {
                const query = /* GraphQL */ `
                    query {
                        actors {
                            name
                            actedInConnection(sort: [{ node: { title: ASC } }]) {
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
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge
                            ORDER BY edge.node.title ASC
                            RETURN collect(edge) AS var4
                        }
                        RETURN { edges: var4, totalCount: totalCount } AS var5
                    }
                    RETURN this { .name, actedInConnection: var5 } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
            });
        });

        describe("field not in selection set", () => {
            test("on edge", async () => {
                const query = /* GraphQL */ `
                    query {
                        actors {
                            name
                            actedInConnection(sort: [{ edge: { screenTime: ASC } }]) {
                                edges {
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
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge
                            ORDER BY edge.properties.screenTime ASC
                            RETURN collect(edge) AS var4
                        }
                        RETURN { edges: var4, totalCount: totalCount } AS var5
                    }
                    RETURN this { .name, actedInConnection: var5 } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
            });

            test("on node", async () => {
                const query = /* GraphQL */ `
                    query {
                        actors {
                            name
                            actedInConnection(sort: [{ node: { title: ASC } }]) {
                                edges {
                                    properties {
                                        screenTime
                                    }
                                    node {
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
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge
                            ORDER BY edge.node.title ASC
                            RETURN collect(edge) AS var4
                        }
                        RETURN { edges: var4, totalCount: totalCount } AS var5
                    }
                    RETURN this { .name, actedInConnection: var5 } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
            });
        });
    });
});
