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

describe("Mixed nesting", () => {
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
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Connection -> Relationship", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                                movies(where: { title_NOT: "Forrest Gump" }) {
                                    title
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
                WHERE this1.name = $param1
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        WHERE NOT (this3.title = $param2)
                        WITH this3 { .title } AS this3
                        RETURN collect(this3) AS var4
                    }
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, movies: var4, __resolveType: \\"Actor\\" } }) AS var5
                }
                RETURN { edges: var5, totalCount: totalCount } AS var6
            }
            RETURN this { .title, actorsConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": \\"Forrest Gump\\"
            }"
        `);
    });

    test("Connection -> Connection -> Relationship", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(where: { node: { name: "Tom Hanks" } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                                moviesConnection(where: { node: { title_NOT: "Forrest Gump" } }) {
                                    edges {
                                        node {
                                            title
                                            actors(where: { name_NOT: "Tom Hanks" }) {
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
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        WHERE NOT (this3.title = $param2)
                        WITH collect({ node: this3, relationship: this2 }) AS edges
                        WITH edges, size(edges) AS totalCount
                        CALL {
                            WITH edges
                            UNWIND edges AS edge
                            WITH edge.node AS this3, edge.relationship AS this2
                            CALL {
                                WITH this3
                                MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                                WHERE NOT (this5.name = $param3)
                                WITH this5 { .name } AS this5
                                RETURN collect(this5) AS var6
                            }
                            RETURN collect({ node: { title: this3.title, actors: var6, __resolveType: \\"Movie\\" } }) AS var7
                        }
                        RETURN { edges: var7, totalCount: totalCount } AS var8
                    }
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { name: this1.name, moviesConnection: var8, __resolveType: \\"Actor\\" } }) AS var9
                }
                RETURN { edges: var9, totalCount: totalCount } AS var10
            }
            RETURN this { .title, actorsConnection: var10 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": \\"Forrest Gump\\",
                \\"param3\\": \\"Tom Hanks\\"
            }"
        `);
    });

    test("Relationship -> Connection", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actors(where: { name: "Tom Hanks" }) {
                        name
                        moviesConnection(where: { node: { title_NOT: "Forrest Gump" } }) {
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
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name = $param1
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    WHERE NOT (this3.title = $param2)
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
                WITH this1 { .name, moviesConnection: var5 } AS this1
                RETURN collect(this1) AS var6
            }
            RETURN this { .title, actors: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom Hanks\\",
                \\"param2\\": \\"Forrest Gump\\"
            }"
        `);
    });
});
