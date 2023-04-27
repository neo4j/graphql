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

import { gql } from "graphql-tag";
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

            interface ActedIn @relationshipProperties {
                screenTime: Int!
                year: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
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
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WITH { screenTime: this0.screenTime, node: { name: this1.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var2
            }
            RETURN this { .title, actorsConnection: var2 } AS this"
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
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WHERE this1.name = $param1
                WITH { screenTime: this0.screenTime, node: { name: this1.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var2
            }
            RETURN this { .title, actorsConnection: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\"
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
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WITH this0, this1
                ORDER BY this0.screenTime DESC
                WITH { screenTime: this0.screenTime, node: { name: this1.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    ORDER BY edge.screenTime DESC
                    RETURN collect(edge) AS var2
                }
                WITH var2 AS edges, totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
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
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WITH this0, this1
                ORDER BY this0.year DESC, this1.name ASC
                WITH { year: this0.year, node: { name: this1.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    ORDER BY edge.year DESC, edge.node.name ASC
                    RETURN collect(edge) AS var2
                }
                WITH var2 AS edges, totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { actorsConnection: var3 } AS this"
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
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                WITH this0, this1
                ORDER BY this1.name ASC, this0.year DESC
                WITH { year: this0.year, node: { name: this1.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    ORDER BY edge.node.name ASC, edge.year DESC
                    RETURN collect(edge) AS var2
                }
                WITH var2 AS edges, totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { actorsConnection: var3 } AS this"
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
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                CALL {
                    WITH this1
                    MATCH (this1:\`Actor\`)-[this2:\`ACTED_IN\`]->(this3:\`Movie\`)
                    WITH { screenTime: this2.screenTime, node: { title: this3.title } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var4
                }
                WITH { screenTime: this0.screenTime, node: { name: this1.name, moviesConnection: var4 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var5
            }
            RETURN this { .title, actorsConnection: var5 } AS this"
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
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                CALL {
                    WITH this1
                    MATCH (this1:\`Actor\`)-[this2:\`ACTED_IN\`]->(this3:\`Movie\`)
                    CALL {
                        WITH this3
                        MATCH (this3:\`Movie\`)<-[this4:\`ACTED_IN\`]-(this5:\`Actor\`)
                        WITH { screenTime: this4.screenTime, node: { name: this5.name } } AS edge
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS var6
                    }
                    WITH { screenTime: this2.screenTime, node: { title: this3.title, actorsConnection: var6 } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var7
                }
                WITH { screenTime: this0.screenTime, node: { name: this1.name, moviesConnection: var7 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var8
            }
            RETURN this { .title, actorsConnection: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });
});
