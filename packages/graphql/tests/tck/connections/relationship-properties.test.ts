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

describe("Relationship Properties Cypher", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
                year: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title_EQ: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting node and relationship properties with where argument", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title_EQ: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name_EQ: "Tom Hanks" } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\"
            }"
        `);
    });

    test("Projecting node and relationship properties with sort argument", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title_EQ: "Forrest Gump" }) {
                    title
                    actorsConnection(sort: { edge: { screenTime: DESC } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    WITH *
                    ORDER BY this0.screenTime DESC
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
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
        const query = /* GraphQL */ `
            query {
                movies {
                    actorsConnection(sort: [{ edge: { year: DESC } }, { node: { name: ASC } }]) {
                        edges {
                            properties {
                                year
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    WITH *
                    ORDER BY this0.year DESC, this1.name ASC
                    RETURN collect({ properties: { year: this0.year, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
    test("Projecting node and relationship properties with sort argument ordered node first", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    actorsConnection(sort: [{ node: { name: ASC } }, { edge: { year: DESC } }]) {
                        edges {
                            properties {
                                year
                            }
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    WITH *
                    ORDER BY this1.name ASC, this0.year DESC
                    RETURN collect({ properties: { year: this0.year, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Projecting twice nested node and relationship properties with no arguments", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title_EQ: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                                moviesConnection {
                                    edges {
                                        properties {
                                            screenTime
                                        }
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        WITH collect({ node: this3, relationship: this2 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this3, edge.relationship AS this2
                            RETURN collect({ properties: { screenTime: this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { title: this3.title, __resolveType: \\"Movie\\" } }) AS var4
                        }
                        RETURN { edges: var4, totalCount: totalCount } AS var5
                    }
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, moviesConnection: var5, __resolveType: \\"Actor\\" } }) AS var6
                }
                RETURN { edges: var6, totalCount: totalCount } AS var7
            }
            RETURN this { .title, actorsConnection: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Projecting thrice nested node and relationship properties with no arguments", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title_EQ: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                                moviesConnection {
                                    edges {
                                        properties {
                                            screenTime
                                        }
                                        node {
                                            title
                                            actorsConnection {
                                                edges {
                                                    properties {
                                                        screenTime
                                                    }
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        WITH collect({ node: this3, relationship: this2 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this3, edge.relationship AS this2
                            CALL {
                                WITH this3
                                MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                                WITH collect({ node: this5, relationship: this4 }) AS edges
                                WITH edges, size(edges) AS totalCount
                                CALL {
                                    WITH edges
                                    UNWIND edges AS edge
                                    WITH edge.node AS this5, edge.relationship AS this4
                                    RETURN collect({ properties: { screenTime: this4.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this5.name, __resolveType: \\"Actor\\" } }) AS var6
                                }
                                RETURN { edges: var6, totalCount: totalCount } AS var7
                            }
                            RETURN collect({ properties: { screenTime: this2.screenTime, __resolveType: \\"ActedIn\\" }, node: { title: this3.title, actorsConnection: var7, __resolveType: \\"Movie\\" } }) AS var8
                        }
                        RETURN { edges: var8, totalCount: totalCount } AS var9
                    }
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, moviesConnection: var9, __resolveType: \\"Actor\\" } }) AS var10
                }
                RETURN { edges: var10, totalCount: totalCount } AS var11
            }
            RETURN this { .title, actorsConnection: var11 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });
});
