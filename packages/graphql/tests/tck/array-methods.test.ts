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

import { Neo4jGraphQL } from "../../src";
import { createBearerToken } from "../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Arrays Methods", () => {
    test("push", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                ratings: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { ratings_PUSH: 1.0 }) {
                    movies {
                        title
                        ratings
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(this.ratings IS NULL, \\"Property ratings cannot be NULL\\", [0])
            SET
                this.ratings = (this.ratings + $param0)
            WITH this
            RETURN this { .title, .ratings } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    1
                ]
            }"
        `);
    });

    test("push multiple", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                ratings: [Float!]!
                scores: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { ratings_PUSH: 1.0, scores_PUSH: 1.0 }) {
                    movies {
                        title
                        ratings
                        scores
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE (apoc.util.validatePredicate(this.ratings IS NULL, \\"Property ratings cannot be NULL\\", [0]) AND apoc.util.validatePredicate(this.scores IS NULL, \\"Property scores cannot be NULL\\", [0]))
            SET
                this.ratings = (this.ratings + $param0),
                this.scores = (this.scores + $param1)
            WITH this
            RETURN this { .title, .ratings, .scores } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    1
                ],
                \\"param1\\": [
                    1
                ]
            }"
        `);
    });

    test("push (point)", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                filmingLocations: [Point!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const inputValue = {
            longitude: -178.7374,
            latitude: 38.4554,
            height: 60111.54,
        };

        const query = /* GraphQL */ `
            mutation UpdateMovie($inputValue: [PointInput!]!) {
                updateMovies(update: { filmingLocations_PUSH: $inputValue }) {
                    movies {
                        title
                        filmingLocations {
                            latitude
                            longitude
                            height
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { inputValue },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(this.filmingLocations IS NULL, \\"Property filmingLocations cannot be NULL\\", [0])
            SET
                this.filmingLocations = (this.filmingLocations + [var0 IN $param0 | point(var0)])
            WITH this
            RETURN this { .title, .filmingLocations } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"longitude\\": -178.7374,
                        \\"latitude\\": 38.4554,
                        \\"height\\": 60111.54
                    }
                ]
            }"
        `);
    });

    test("push auth", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type Movie @node {
                title: String!
                ratings: [Float!]!
                    @authorization(
                        validate: [{ operations: [UPDATE], where: { jwt: { roles: { includes: "update" } } } }]
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { ratings_PUSH: 1.0 }) {
                    movies {
                        title
                        ratings
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(this.ratings IS NULL, \\"Property ratings cannot be NULL\\", [0])
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.ratings = (this.ratings + $param3)
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            RETURN this { .title, .ratings } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"update\\",
                \\"param3\\": [
                    1
                ],
                \\"param4\\": \\"update\\"
            }"
        `);
    });

    test("pop", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                ratings: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { ratings_POP: 1 }) {
                    movies {
                        title
                        ratings
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(this.ratings IS NULL, \\"Property ratings cannot be NULL\\", [0])
            SET
                this.ratings = this.ratings[0..-$param0]
            WITH this
            RETURN this { .title, .ratings } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("pop multiple", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                ratings: [Float!]!
                scores: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { ratings_POP: 1, scores_POP: 1 }) {
                    movies {
                        title
                        ratings
                        scores
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE (apoc.util.validatePredicate(this.ratings IS NULL, \\"Property ratings cannot be NULL\\", [0]) AND apoc.util.validatePredicate(this.scores IS NULL, \\"Property scores cannot be NULL\\", [0]))
            SET
                this.ratings = this.ratings[0..-$param0],
                this.scores = this.scores[0..-$param1]
            WITH this
            RETURN this { .title, .ratings, .scores } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("pop auth", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type Movie @node {
                title: String!
                ratings: [Float!]!
                    @authorization(
                        validate: [{ operations: [UPDATE], where: { jwt: { roles: { includes: "update" } } } }]
                    )
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { ratings_POP: 1 }) {
                    movies {
                        title
                        ratings
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(this.ratings IS NULL, \\"Property ratings cannot be NULL\\", [0])
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.ratings = this.ratings[0..-$param3]
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            RETURN this { .title, .ratings } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"param2\\": \\"update\\",
                \\"param3\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param4\\": \\"update\\"
            }"
        `);
    });

    test("pop and push", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                ratings: [Float!]!
                scores: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { ratings_PUSH: 1.5, scores_POP: 1 }) {
                    movies {
                        title
                        ratings
                        scores
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE (apoc.util.validatePredicate(this.ratings IS NULL, \\"Property ratings cannot be NULL\\", [0]) AND apoc.util.validatePredicate(this.scores IS NULL, \\"Property scores cannot be NULL\\", [0]))
            SET
                this.ratings = (this.ratings + $param0),
                this.scores = this.scores[0..-$param1]
            WITH this
            RETURN this { .title, .ratings, .scores } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    1.5
                ],
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("push on relationship properties", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                id: ID!
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                pay: [Float!]
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateActors(where: { id: { eq: 1 } }, update: { actedIn: [{ update: { edge: { pay_PUSH: 10 } } }] }) {
                    actors {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                                properties {
                                    pay
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH *
                WHERE apoc.util.validatePredicate(this0.pay IS NULL, \\"Property pay cannot be NULL\\", [0])
                SET
                    this0.pay = (this0.pay + $param1)
            }
            WITH this
            CALL (this) {
                MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                WITH DISTINCT this3
                WITH this3 { .title } AS this3
                RETURN collect(this3) AS var4
            }
            CALL (this) {
                MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                WITH collect({ node: this6, relationship: this5 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this6, edge.relationship AS this5
                    RETURN collect({ properties: { pay: this5.pay, __resolveType: \\"ActedIn\\" }, node: { __id: id(this6), __resolveType: \\"Movie\\" } }) AS var7
                }
                RETURN { edges: var7 } AS var8
            }
            RETURN this { .name, actedIn: var4, actedInConnection: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": [
                    10
                ]
            }"
        `);
    });

    test("pop on relationship properties", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                id: ID!
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                pay: [Float!]
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateActors(where: { id: { eq: 1 } }, update: { actedIn: [{ update: { edge: { pay_POP: 1 } } }] }) {
                    actors {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                                properties {
                                    pay
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH *
                WHERE apoc.util.validatePredicate(this0.pay IS NULL, \\"Property pay cannot be NULL\\", [0])
                SET
                    this0.pay = this0.pay[0..-$param1]
            }
            WITH this
            CALL (this) {
                MATCH (this)-[this2:ACTED_IN]->(this3:Movie)
                WITH DISTINCT this3
                WITH this3 { .title } AS this3
                RETURN collect(this3) AS var4
            }
            CALL (this) {
                MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                WITH collect({ node: this6, relationship: this5 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this6, edge.relationship AS this5
                    RETURN collect({ properties: { pay: this5.pay, __resolveType: \\"ActedIn\\" }, node: { __id: id(this6), __resolveType: \\"Movie\\" } }) AS var7
                }
                RETURN { edges: var7 } AS var8
            }
            RETURN this { .name, actedIn: var4, actedInConnection: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
