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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../src";
import { createJwtRequest } from "../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("Arrays Methods", () => {
    test("push", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
            mutation {
                updateMovies(update: { ratings_PUSH: 1.0 }) {
                    movies {
                        title
                        ratings
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
            CALL apoc.util.validate(this.ratings IS NULL, \\"Property %s cannot be NULL\\", ['ratings'])
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
        const typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]!
                scores: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL apoc.util.validate(this.ratings IS NULL OR this.scores IS NULL, \\"Properties %s, %s cannot be NULL\\", ['ratings', 'scores'])
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
        const typeDefs = gql`
            type Movie {
                title: String!
                filmingLocations: [Point!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const inputValue = {
            longitude: -178.7374,
            latitude: 38.4554,
            height: 60111.54,
        };

        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: { inputValue },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL apoc.util.validate(this.filmingLocations IS NULL, \\"Property %s cannot be NULL\\", ['filmingLocations'])
            SET this.filmingLocations = this.filmingLocations + [p in $this_update_filmingLocations_PUSH | point(p)]
            RETURN collect(DISTINCT this { .title, filmingLocations: (CASE
                WHEN this.filmingLocations IS NOT NULL THEN [p_var0 IN this.filmingLocations | { point: p_var0 }]
                ELSE NULL
            END) }) AS data"
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
        const typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]! @auth(rules: [{ operations: [UPDATE], isAuthenticated: true }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
            mutation {
                updateMovies(update: { ratings_PUSH: 1.0 }) {
                    movies {
                        title
                        ratings
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
            WITH this
            CALL apoc.util.validate(NOT (apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(this.ratings IS NULL, \\"Property %s cannot be NULL\\", ['ratings'])
            SET this.ratings = this.ratings + $this_update_ratings_PUSH
            RETURN collect(DISTINCT this { .title, .ratings }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_ratings_PUSH\\": [
                    1
                ],
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });

    test("pop", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
            mutation {
                updateMovies(update: { ratings_POP: 1 }) {
                    movies {
                        title
                        ratings
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
            CALL apoc.util.validate(this.ratings IS NULL, \\"Property %s cannot be NULL\\", ['ratings'])
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
        const typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]!
                scores: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL apoc.util.validate(this.ratings IS NULL OR this.scores IS NULL, \\"Properties %s, %s cannot be NULL\\", ['ratings', 'scores'])
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
        const typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]! @auth(rules: [{ operations: [UPDATE], isAuthenticated: true }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
            mutation {
                updateMovies(update: { ratings_POP: 1 }) {
                    movies {
                        title
                        ratings
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
            WITH this
            CALL apoc.util.validate(NOT (apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(this.ratings IS NULL, \\"Property %s cannot be NULL\\", ['ratings'])
            SET this.ratings = this.ratings[0..-$this_update_ratings_POP]
            RETURN collect(DISTINCT this { .title, .ratings }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_ratings_POP\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });

    test("pop and push", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]!
                scores: [Float!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL apoc.util.validate(this.ratings IS NULL OR this.scores IS NULL, \\"Properties %s, %s cannot be NULL\\", ['ratings', 'scores'])
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

            interface ActedIn @relationshipProperties {
                pay: [Float]
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
            mutation {
                updateActors(where: { id: 1 }, update: { actedIn: [{ update: { edge: { pay_PUSH: 10 } } }] }) {
                    actors {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                                pay
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
            WITH *
            WHERE this.id = $param0
            WITH this
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            CALL apoc.do.when(this_acted_in0_relationship IS NOT NULL, \\"
            SET this_acted_in0_relationship.pay = this_acted_in0_relationship.pay + $updateActors.args.update.actedIn[0].update.edge.pay_PUSH
            RETURN count(*) AS _
            \\", \\"\\", {this:this, this_acted_in0_relationship:this_acted_in0_relationship, updateActors: $updateActors, resolvedCallbacks: $resolvedCallbacks})
            YIELD value AS this_acted_in0_relationship_actedIn0_edge
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(this_actedIn:\`Movie\`)
                WITH this_actedIn { .title } AS this_actedIn
                RETURN collect(this_actedIn) AS this_actedIn
            }
            CALL {
                WITH this
                MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                WITH { pay: this_connection_actedInConnectionthis0.pay } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actedInConnection
            }
            RETURN collect(DISTINCT this { .name, actedIn: this_actedIn, actedInConnection: this_actedInConnection }) AS data"
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

            interface ActedIn @relationshipProperties {
                pay: [Float]
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = gql`
            mutation {
                updateActors(where: { id: 1 }, update: { actedIn: [{ update: { edge: { pay_POP: 1 } } }] }) {
                    actors {
                        name
                        actedIn {
                            title
                        }
                        actedInConnection {
                            edges {
                                pay
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
            WITH *
            WHERE this.id = $param0
            WITH this
            OPTIONAL MATCH (this)-[this_acted_in0_relationship:ACTED_IN]->(this_actedIn0:Movie)
            CALL apoc.do.when(this_acted_in0_relationship IS NOT NULL, \\"
            SET this_acted_in0_relationship.pay = this_acted_in0_relationship.pay[0..-$updateActors.args.update.actedIn[0].update.edge.pay_POP]
            RETURN count(*) AS _
            \\", \\"\\", {this:this, this_acted_in0_relationship:this_acted_in0_relationship, updateActors: $updateActors, resolvedCallbacks: $resolvedCallbacks})
            YIELD value AS this_acted_in0_relationship_actedIn0_edge
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(this_actedIn:\`Movie\`)
                WITH this_actedIn { .title } AS this_actedIn
                RETURN collect(this_actedIn) AS this_actedIn
            }
            CALL {
                WITH this
                MATCH (this)-[this_connection_actedInConnectionthis0:ACTED_IN]->(this_Movie:\`Movie\`)
                WITH { pay: this_connection_actedInConnectionthis0.pay } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actedInConnection
            }
            RETURN collect(DISTINCT this { .name, actedIn: this_actedIn, actedInConnection: this_actedInConnection }) AS data"
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
