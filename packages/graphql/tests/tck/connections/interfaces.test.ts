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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher -> Connections -> Interfaces", () => {
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
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Projecting interface node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                actors {
                    name
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
                    MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                    WITH { screenTime: this_connection_actedInConnectionthis0.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this_connection_actedInConnectionthis1:ACTED_IN]->(this_Series:\`Series\`)
                    WITH { screenTime: this_connection_actedInConnectionthis1.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS actedInConnection
            }
            RETURN this { .name, actedInConnection: actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Projecting interface node and relationship properties with common where argument", async () => {
        const query = gql`
            query {
                actors {
                    name
                    actedInConnection(where: { node: { title_STARTS_WITH: "The " } }) {
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
                    MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                    WHERE this_Movie.title STARTS WITH $this_connection_actedInConnectionparam0
                    WITH { screenTime: this_connection_actedInConnectionthis0.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this_connection_actedInConnectionthis1:ACTED_IN]->(this_Series:\`Series\`)
                    WHERE this_Series.title STARTS WITH $this_connection_actedInConnectionparam1
                    WITH { screenTime: this_connection_actedInConnectionthis1.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS actedInConnection
            }
            RETURN this { .name, actedInConnection: actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connection_actedInConnectionparam0\\": \\"The \\",
                \\"this_connection_actedInConnectionparam1\\": \\"The \\"
            }"
        `);
    });

    test("Projecting interface node and relationship properties with where argument", async () => {
        const query = gql`
            query {
                actors {
                    name
                    actedInConnection(
                        where: { node: { _on: { Movie: { runtime_GT: 90 }, Series: { episodes_GT: 50 } } } }
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
                    MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                    WHERE this_Movie.runtime > $this_connection_actedInConnectionparam0
                    WITH { screenTime: this_connection_actedInConnectionthis0.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this_connection_actedInConnectionthis1:ACTED_IN]->(this_Series:\`Series\`)
                    WHERE this_Series.episodes > $this_connection_actedInConnectionparam1
                    WITH { screenTime: this_connection_actedInConnectionthis1.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS actedInConnection
            }
            RETURN this { .name, actedInConnection: actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connection_actedInConnectionparam0\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"this_connection_actedInConnectionparam1\\": {
                    \\"low\\": 50,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Projecting interface node and relationship properties with where relationship argument", async () => {
        const query = gql`
            query {
                actors {
                    name
                    actedInConnection(where: { edge: { screenTime_GT: 60 } }) {
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
                    MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                    WHERE this_connection_actedInConnectionthis0.screenTime > $this_connection_actedInConnectionparam0
                    WITH { screenTime: this_connection_actedInConnectionthis0.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this_connection_actedInConnectionthis1:ACTED_IN]->(this_Series:\`Series\`)
                    WHERE this_connection_actedInConnectionthis1.screenTime > $this_connection_actedInConnectionparam1
                    WITH { screenTime: this_connection_actedInConnectionthis1.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS actedInConnection
            }
            RETURN this { .name, actedInConnection: actedInConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_connection_actedInConnectionparam0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"this_connection_actedInConnectionparam1\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                }
            }"
        `);
    });

    describe("Projecting interface node and relationship properties with sort argument", () => {
        describe("field in selection set", () => {
            test("on edge", async () => {
                const query = gql`
                    query {
                        actors {
                            name
                            actedInConnection(sort: [{ edge: { screenTime: ASC } }]) {
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
                            MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                            WITH { screenTime: this_connection_actedInConnectionthis0.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
                            RETURN edge
                            UNION
                            WITH this
                            MATCH (this)-[this_connection_actedInConnectionthis1:ACTED_IN]->(this_Series:\`Series\`)
                            WITH { screenTime: this_connection_actedInConnectionthis1.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
                            RETURN edge
                        }
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        UNWIND edges AS edge
                        WITH edge, totalCount
                        ORDER BY edge.screenTime ASC
                        WITH collect(edge) AS edges, totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS actedInConnection
                    }
                    RETURN this { .name, actedInConnection: actedInConnection } as this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
            });

            test("on node", async () => {
                const query = gql`
                    query {
                        actors {
                            name
                            actedInConnection(sort: [{ node: { title: ASC } }]) {
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
                            MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                            WITH { screenTime: this_connection_actedInConnectionthis0.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
                            RETURN edge
                            UNION
                            WITH this
                            MATCH (this)-[this_connection_actedInConnectionthis1:ACTED_IN]->(this_Series:\`Series\`)
                            WITH { screenTime: this_connection_actedInConnectionthis1.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
                            RETURN edge
                        }
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        UNWIND edges AS edge
                        WITH edge, totalCount
                        ORDER BY edge.node.title ASC
                        WITH collect(edge) AS edges, totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS actedInConnection
                    }
                    RETURN this { .name, actedInConnection: actedInConnection } as this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
            });
        });

        describe("field not in selection set", () => {
            test("on edge", async () => {
                const query = gql`
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
                            MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                            WITH { screenTime: this_connection_actedInConnectionthis0.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
                            RETURN edge
                            UNION
                            WITH this
                            MATCH (this)-[this_connection_actedInConnectionthis1:ACTED_IN]->(this_Series:\`Series\`)
                            WITH { screenTime: this_connection_actedInConnectionthis1.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
                            RETURN edge
                        }
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        UNWIND edges AS edge
                        WITH edge, totalCount
                        ORDER BY edge.screenTime ASC
                        WITH collect(edge) AS edges, totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS actedInConnection
                    }
                    RETURN this { .name, actedInConnection: actedInConnection } as this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
            });

            test("on node", async () => {
                const query = gql`
                    query {
                        actors {
                            name
                            actedInConnection(sort: [{ node: { title: ASC } }]) {
                                edges {
                                    screenTime
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
                            MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                            WITH { screenTime: this_connection_actedInConnectionthis0.screenTime, node: { __resolveType: \\"Movie\\", runtime: this_Movie.runtime, title: this_Movie.title } } AS edge
                            RETURN edge
                            UNION
                            WITH this
                            MATCH (this)-[this_connection_actedInConnectionthis1:ACTED_IN]->(this_Series:\`Series\`)
                            WITH { screenTime: this_connection_actedInConnectionthis1.screenTime, node: { __resolveType: \\"Series\\", episodes: this_Series.episodes, title: this_Series.title } } AS edge
                            RETURN edge
                        }
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        UNWIND edges AS edge
                        WITH edge, totalCount
                        ORDER BY edge.node.title ASC
                        WITH collect(edge) AS edges, totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS actedInConnection
                    }
                    RETURN this { .name, actedInConnection: actedInConnection } as this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
            });
        });
    });
});
