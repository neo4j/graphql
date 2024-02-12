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
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Composite", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                firstName: String!
                lastName: String!
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

    test("Composite", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: {
                            node: { AND: [{ firstName: "Tom" }, { lastName: "Hanks" }] }
                            edge: { AND: [{ screenTime_GT: 30 }, { screenTime_LT: 90 }] }
                        }
                    ) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                firstName
                                lastName
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
                WHERE ((this1.firstName = $param1 AND this1.lastName = $param2) AND (this0.screenTime > $param3 AND this0.screenTime < $param4))
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { firstName: this1.firstName, lastName: this1.lastName, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom\\",
                \\"param2\\": \\"Hanks\\",
                \\"param3\\": {
                    \\"low\\": 30,
                    \\"high\\": 0
                },
                \\"param4\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Composite NOT", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: {
                            node: { NOT: { firstName: "Tom", lastName: "Hanks" } }
                            edge: { NOT: { screenTime_GT: 30, screenTime_LT: 90 } }
                        }
                    ) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                firstName
                                lastName
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
                WHERE (NOT (this1.firstName = $param1 AND this1.lastName = $param2) AND NOT (this0.screenTime < $param3 AND this0.screenTime > $param4))
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { firstName: this1.firstName, lastName: this1.lastName, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom\\",
                \\"param2\\": \\"Hanks\\",
                \\"param3\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param4\\": {
                    \\"low\\": 30,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Composite OR (edge and node)", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: {
                            OR: [
                                { node: { AND: [{ firstName: "Tom" }, { lastName: "Hanks" }] } }
                                { edge: { AND: [{ screenTime_GT: 30 }, { screenTime_LT: 90 }] } }
                            ]
                        }
                    ) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                firstName
                                lastName
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
                WHERE ((this1.firstName = $param1 AND this1.lastName = $param2) OR (this0.screenTime > $param3 AND this0.screenTime < $param4))
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { firstName: this1.firstName, lastName: this1.lastName, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom\\",
                \\"param2\\": \\"Hanks\\",
                \\"param3\\": {
                    \\"low\\": 30,
                    \\"high\\": 0
                },
                \\"param4\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Composite NOT with nested OR (edge and node)", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: {
                            NOT: {
                                OR: [
                                    { node: { AND: [{ firstName: "Tom" }, { lastName: "Hanks" }] } }
                                    { edge: { AND: [{ screenTime_GT: 30 }, { screenTime_LT: 90 }] } }
                                ]
                            }
                        }
                    ) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                firstName
                                lastName
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
                WHERE NOT ((this1.firstName = $param1 AND this1.lastName = $param2) OR (this0.screenTime > $param3 AND this0.screenTime < $param4))
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { firstName: this1.firstName, lastName: this1.lastName, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom\\",
                \\"param2\\": \\"Hanks\\",
                \\"param3\\": {
                    \\"low\\": 30,
                    \\"high\\": 0
                },
                \\"param4\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Composite NOT with complex nested filters", async () => {
        const query = gql`
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: {
                            NOT: {
                                AND: [
                                    {
                                        OR: [
                                            { node: { AND: [{ firstName: "Tom" }, { lastName: "Hanks" }] } }
                                            { edge: { AND: [{ screenTime_GT: 30 }, { screenTime_LT: 90 }] } }
                                        ]
                                    }
                                    { node: { AND: [{ firstName: "Tommy" }, { lastName: "Ford" }] } }
                                ]
                            }
                        }
                    ) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                firstName
                                lastName
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
                WHERE NOT (((this1.firstName = $param1 AND this1.lastName = $param2) OR (this0.screenTime > $param3 AND this0.screenTime < $param4)) AND (this1.firstName = $param5 AND this1.lastName = $param6))
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ properties: { screenTime: this0.screenTime, __resolveType: \\"ActedIn\\" }, node: { firstName: this1.firstName, lastName: this1.lastName, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\",
                \\"param1\\": \\"Tom\\",
                \\"param2\\": \\"Hanks\\",
                \\"param3\\": {
                    \\"low\\": 30,
                    \\"high\\": 0
                },
                \\"param4\\": {
                    \\"low\\": 90,
                    \\"high\\": 0
                },
                \\"param5\\": \\"Tommy\\",
                \\"param6\\": \\"Ford\\"
            }"
        `);
    });
});
