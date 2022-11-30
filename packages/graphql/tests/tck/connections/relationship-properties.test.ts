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

describe("Relationship Properties Cypher", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn {
                screenTime: Int!
                year: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            screenTime
                            node {
                                name
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
            "MATCH (this:\`Movie\`)
            WITH *
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting node and relationship properties with where argument", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                        edges {
                            screenTime
                            node {
                                name
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
            "MATCH (this:\`Movie\`)
            WITH *
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WHERE this_Actor.name = $this_connection_actorsConnectionparam0
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"this_connection_actorsConnectionparam0\\": \\"Tom Hanks\\"
            }"
        `);
    });

    test("Projecting node and relationship properties with sort argument", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(sort: { edge: { screenTime: DESC } }) {
                        edges {
                            screenTime
                            node {
                                name
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
            "MATCH (this:\`Movie\`)
            WITH *
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WITH this_connection_actorsConnectionthis0, this_Actor
                ORDER BY this_connection_actorsConnectionthis0.screenTime DESC
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    ORDER BY edge.screenTime DESC
                    RETURN collect(edge) AS this_connection_actorsConnectionvar1
                }
                WITH this_connection_actorsConnectionvar1 AS edges, totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting node and relationship properties with sort argument ordered edge first", async () => {
        const query = gql`
            query {
                movies {
                    actorsConnection(sort: [{ edge: { year: DESC } }, { node: { name: ASC } }]) {
                        edges {
                            year
                            node {
                                name
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
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WITH this_connection_actorsConnectionthis0, this_Actor
                ORDER BY this_connection_actorsConnectionthis0.year DESC, this_Actor.name ASC
                WITH { year: this_connection_actorsConnectionthis0.year, node: { name: this_Actor.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    ORDER BY edge.year DESC, edge.node.name ASC
                    RETURN collect(edge) AS this_connection_actorsConnectionvar1
                }
                WITH this_connection_actorsConnectionvar1 AS edges, totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
    test("Projecting node and relationship properties with sort argument ordered node first", async () => {
        const query = gql`
            query {
                movies {
                    actorsConnection(sort: [{ node: { name: ASC } }, { edge: { year: DESC } }]) {
                        edges {
                            year
                            node {
                                name
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
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                WITH this_connection_actorsConnectionthis0, this_Actor
                ORDER BY this_Actor.name ASC, this_connection_actorsConnectionthis0.year DESC
                WITH { year: this_connection_actorsConnectionthis0.year, node: { name: this_Actor.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    ORDER BY edge.node.name ASC, edge.year DESC
                    RETURN collect(edge) AS this_connection_actorsConnectionvar1
                }
                WITH this_connection_actorsConnectionvar1 AS edges, totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Projecting twice nested node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection {
                                    edges {
                                        screenTime
                                        node {
                                            title
                                        }
                                    }
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
            "MATCH (this:\`Movie\`)
            WITH *
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                CALL {
                    WITH this_Actor
                    MATCH (this_Actor)-[this_Actor_connection_moviesConnectionthis0:ACTED_IN]->(this_Actor_Movie:\`Movie\`)
                    WITH { screenTime: this_Actor_connection_moviesConnectionthis0.screenTime, node: { title: this_Actor_Movie.title } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_Actor_moviesConnection
                }
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, moviesConnection: this_Actor_moviesConnection } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting thrice nested node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            screenTime
                            node {
                                name
                                moviesConnection {
                                    edges {
                                        screenTime
                                        node {
                                            title
                                            actorsConnection {
                                                edges {
                                                    screenTime
                                                    node {
                                                        name
                                                    }
                                                }
                                            }
                                        }
                                    }
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
            "MATCH (this:\`Movie\`)
            WITH *
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Actor\`)
                CALL {
                    WITH this_Actor
                    MATCH (this_Actor)-[this_Actor_connection_moviesConnectionthis0:ACTED_IN]->(this_Actor_Movie:\`Movie\`)
                    CALL {
                        WITH this_Actor_Movie
                        MATCH (this_Actor_Movie)<-[this_Actor_Movie_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor_Movie_Actor:\`Actor\`)
                        WITH { screenTime: this_Actor_Movie_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor_Movie_Actor.name } } AS edge
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS this_Actor_Movie_actorsConnection
                    }
                    WITH { screenTime: this_Actor_connection_moviesConnectionthis0.screenTime, node: { title: this_Actor_Movie.title, actorsConnection: this_Actor_Movie_actorsConnection } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this_Actor_moviesConnection
                }
                WITH { screenTime: this_connection_actorsConnectionthis0.screenTime, node: { name: this_Actor.name, moviesConnection: this_Actor_moviesConnection } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });
});
