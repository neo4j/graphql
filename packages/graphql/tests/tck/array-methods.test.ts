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
            type Movie {
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
            "MATCH (this:Movie)
            WITH this
            WHERE apoc.util.validatePredicate(this.ratings IS NULL, \\"Property %s cannot be NULL\\", ['ratings'])
            SET this.ratings = this.ratings + $this_update_ratings_PUSH
            RETURN collect(DISTINCT this { .title, .ratings }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_ratings_PUSH\\": [
                    1
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("push multiple", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
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
            "MATCH (this:Movie)
            WITH this
            WHERE apoc.util.validatePredicate(this.ratings IS NULL OR this.scores IS NULL, \\"Properties %s, %s cannot be NULL\\", ['ratings', 'scores'])
            SET this.ratings = this.ratings + $this_update_ratings_PUSH
            SET this.scores = this.scores + $this_update_scores_PUSH
            RETURN collect(DISTINCT this { .title, .ratings, .scores }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_ratings_PUSH\\": [
                    1
                ],
                \\"this_update_scores_PUSH\\": [
                    1
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("push (point)", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
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
            "MATCH (this:Movie)
            WITH this
            WHERE apoc.util.validatePredicate(this.filmingLocations IS NULL, \\"Property %s cannot be NULL\\", ['filmingLocations'])
            SET this.filmingLocations = this.filmingLocations + [p in $this_update_filmingLocations_PUSH | point(p)]
            RETURN collect(DISTINCT this { .title, filmingLocations: CASE
                WHEN this.filmingLocations IS NOT NULL THEN [update_var0 IN this.filmingLocations | { point: update_var0 }]
                ELSE NULL
            END }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_filmingLocations_PUSH\\": [
                    {
                        \\"longitude\\": -178.7374,
                        \\"latitude\\": 38.4554,
                        \\"height\\": 60111.54
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("push auth", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type Movie {
                title: String!
                ratings: [Float!]!
                    @authorization(validate: [{ operations: [UPDATE], where: { jwt: { roles_INCLUDES: "update" } } }])
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
            "MATCH (this:Movie)
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(this.ratings IS NULL, \\"Property %s cannot be NULL\\", ['ratings'])
            SET this.ratings = this.ratings + $this_update_ratings_PUSH
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .title, .ratings }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"authorization__before_param2\\": \\"update\\",
                \\"authorization__after_param2\\": \\"update\\",
                \\"this_update_ratings_PUSH\\": [
                    1
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("pop", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
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
            "MATCH (this:Movie)
            WITH this
            WHERE apoc.util.validatePredicate(this.ratings IS NULL, \\"Property %s cannot be NULL\\", ['ratings'])
            SET this.ratings = this.ratings[0..-$this_update_ratings_POP]
            RETURN collect(DISTINCT this { .title, .ratings }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_ratings_POP\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("pop multiple", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
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
            "MATCH (this:Movie)
            WITH this
            WHERE apoc.util.validatePredicate(this.ratings IS NULL OR this.scores IS NULL, \\"Properties %s, %s cannot be NULL\\", ['ratings', 'scores'])
            SET this.ratings = this.ratings[0..-$this_update_ratings_POP]
            SET this.scores = this.scores[0..-$this_update_scores_POP]
            RETURN collect(DISTINCT this { .title, .ratings, .scores }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_ratings_POP\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"this_update_scores_POP\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("pop auth", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type Movie {
                title: String!
                ratings: [Float!]!
                    @authorization(validate: [{ operations: [UPDATE], where: { jwt: { roles_INCLUDES: "update" } } }])
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
            "MATCH (this:Movie)
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(this.ratings IS NULL, \\"Property %s cannot be NULL\\", ['ratings'])
            SET this.ratings = this.ratings[0..-$this_update_ratings_POP]
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .title, .ratings }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": []
                },
                \\"authorization__before_param2\\": \\"update\\",
                \\"authorization__after_param2\\": \\"update\\",
                \\"this_update_ratings_POP\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("pop and push", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
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
            "MATCH (this:Movie)
            WITH this
            WHERE apoc.util.validatePredicate(this.ratings IS NULL OR this.scores IS NULL, \\"Properties %s, %s cannot be NULL\\", ['ratings', 'scores'])
            SET this.ratings = this.ratings + $this_update_ratings_PUSH
            SET this.scores = this.scores[0..-$this_update_scores_POP]
            RETURN collect(DISTINCT this { .title, .ratings, .scores }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_ratings_PUSH\\": [
                    1.5
                ],
                \\"this_update_scores_POP\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("push on relationship properties", async () => {
        const typeDefs = `
            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                id: ID!
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                pay: [Float]
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateActors(where: { id: 1 }, update: { actedIn: [{ update: { edge: { pay_PUSH: 10 } } }] }) {
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
            "MATCH (this:Actor)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            	SET this_acted_in0_relationship.pay = this_acted_in0_relationship.pay + $updateActors.args.update.actedIn[0].update.edge.pay_PUSH
            	RETURN count(*) AS update_this_actedIn0
            }
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(update_this1:Movie)
                WITH update_this1 { .title } AS update_this1
                RETURN collect(update_this1) AS update_var2
            }
            CALL {
                WITH this
                MATCH (this)-[update_this3:ACTED_IN]->(update_this4:Movie)
                WITH collect({ node: update_this4, relationship: update_this3 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS update_this4, edge.relationship AS update_this3
                    RETURN collect({ properties: { pay: update_this3.pay, __resolveType: \\"ActedIn\\" }, node: { __id: id(update_this4), __resolveType: \\"Movie\\" } }) AS update_var5
                }
                RETURN { edges: update_var5, totalCount: totalCount } AS update_var6
            }
            RETURN collect(DISTINCT this { .name, actedIn: update_var2, actedInConnection: update_var6 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"update\\": {
                                        \\"edge\\": {
                                            \\"pay_PUSH\\": [
                                                10
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("pop on relationship properties", async () => {
        const typeDefs = `
            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor {
                id: ID!
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                pay: [Float]
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            mutation {
                updateActors(where: { id: 1 }, update: { actedIn: [{ update: { edge: { pay_POP: 1 } } }] }) {
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
            "MATCH (this:Actor)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            	SET this_acted_in0_relationship.pay = this_acted_in0_relationship.pay[0..-$updateActors.args.update.actedIn[0].update.edge.pay_POP]
            	RETURN count(*) AS update_this_actedIn0
            }
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(update_this1:Movie)
                WITH update_this1 { .title } AS update_this1
                RETURN collect(update_this1) AS update_var2
            }
            CALL {
                WITH this
                MATCH (this)-[update_this3:ACTED_IN]->(update_this4:Movie)
                WITH collect({ node: update_this4, relationship: update_this3 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS update_this4, edge.relationship AS update_this3
                    RETURN collect({ properties: { pay: update_this3.pay, __resolveType: \\"ActedIn\\" }, node: { __id: id(update_this4), __resolveType: \\"Movie\\" } }) AS update_var5
                }
                RETURN { edges: update_var5, totalCount: totalCount } AS update_var6
            }
            RETURN collect(DISTINCT this { .name, actedIn: update_var2, actedInConnection: update_var6 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateActors\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actedIn\\": [
                                {
                                    \\"update\\": {
                                        \\"edge\\": {
                                            \\"pay_POP\\": {
                                                \\"low\\": 1,
                                                \\"high\\": 0
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
