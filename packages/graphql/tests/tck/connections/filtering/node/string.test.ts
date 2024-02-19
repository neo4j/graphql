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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import {
    formatCypher,
    formatParams,
    setTestEnvVars,
    translateQuery,
    unsetTestEnvVars,
} from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Node -> String", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        MATCHES: true,
                    },
                },
            },
        });
        setTestEnvVars("NEO4J_GRAPHQL_ENABLE_REGEX=1");
    });

    afterAll(() => {
        unsetTestEnvVars(undefined);
    });

    test("CONTAINS", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_CONTAINS: "Tom" } }) {
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
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name CONTAINS $param0
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
                \\"param0\\": \\"Tom\\"
            }"
        `);
    });

    test("NOT_CONTAINS", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_NOT_CONTAINS: "Tom" } }) {
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
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE NOT (this1.name CONTAINS $param0)
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
                \\"param0\\": \\"Tom\\"
            }"
        `);
    });

    test("STARTS_WITH", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_STARTS_WITH: "Tom" } }) {
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
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name STARTS WITH $param0
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
                \\"param0\\": \\"Tom\\"
            }"
        `);
    });

    test("NOT_STARTS_WITH", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_NOT_STARTS_WITH: "Tom" } }) {
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
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE NOT (this1.name STARTS WITH $param0)
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
                \\"param0\\": \\"Tom\\"
            }"
        `);
    });

    test("ENDS_WITH", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_ENDS_WITH: "Hanks" } }) {
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
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name ENDS WITH $param0
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
                \\"param0\\": \\"Hanks\\"
            }"
        `);
    });

    test("NOT_ENDS_WITH", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_NOT_ENDS_WITH: "Hanks" } }) {
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
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE NOT (this1.name ENDS WITH $param0)
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
                \\"param0\\": \\"Hanks\\"
            }"
        `);
    });

    test("MATCHES", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_MATCHES: "Tom.+" } }) {
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
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                WHERE this1.name =~ $param0
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
                \\"param0\\": \\"Tom.+\\"
            }"
        `);
    });
});
