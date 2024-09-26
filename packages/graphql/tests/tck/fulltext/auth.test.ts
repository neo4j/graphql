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
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, translateQuery } from "../utils/tck-test-utils";

describe("Cypher -> fulltext -> Auth", () => {
    let verifyTCK;

    beforeAll(() => {
        if (process.env.VERIFY_TCK) {
            verifyTCK = process.env.VERIFY_TCK;
            delete process.env.VERIFY_TCK;
        }
    });

    afterAll(() => {
        if (verifyTCK) {
            process.env.VERIFY_TCK = verifyTCK;
        }
    });

    describe("4.4", () => {
        test("simple match with auth where", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(filter: [{ where: { node: { director: { id_EQ: "$jwt.sub" } } } }]) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE ($isAuthenticated = true AND size([(this0)<-[:DIRECTED]-(this2:Person) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1]) > 0)
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(validate: [{ when: [BEFORE], where: { node: { director: { id_EQ: "$jwt.sub" } } } }]) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)<-[:DIRECTED]-(this2:Person) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow ALL", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [{ when: [BEFORE], where: { node: { director_ALL: { id_EQ: "$jwt.sub" } } } }]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)<-[:DIRECTED]-(this2:Person) WHERE NOT ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1]) = 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow on connection node", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [
                            { when: [BEFORE], where: { node: { directorConnection: { node: { id_EQ: "$jwt.sub" } } } } }
                        ]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)<-[this3:DIRECTED]-(this2:Person) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow on connection node ALL", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                where: { node: { directorConnection_ALL: { node: { id_EQ: "$jwt.sub" } } } }
                            }
                        ]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)<-[this3:DIRECTED]-(this2:Person) WHERE NOT ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1]) = 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow on connection edge", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [
                            { when: [BEFORE], where: { node: { directorConnection: { edge: { year_EQ: 2020 } } } } }
                        ]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
                }

                type Person @node {
                    id: ID
                }

                type Directed @relationshipProperties {
                    year: Int
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)<-[this2:DIRECTED]-(this3:Person) WHERE ($param3 IS NOT NULL AND this2.year = $param3) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "param0": "something AND something",
                  "param1": "Movie",
                  "param3": 2020,
                }
            `);
        });

        test("simple match with auth allow on connection edge ALL", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [
                            { when: [BEFORE], where: { node: { directorConnection_ALL: { edge: { year_EQ: 2020 } } } } }
                        ]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
                }

                type Person @node {
                    id: ID
                }

                type Directed @relationshipProperties {
                    year: Int
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)<-[this2:DIRECTED]-(this3:Person) WHERE NOT ($param3 IS NOT NULL AND this2.year = $param3) | 1]) = 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "param0": "something AND something",
                  "param1": "Movie",
                  "param3": 2020,
                }
            `);
        });
    });

    describe("5", () => {
        test("simple match with auth where", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(filter: [{ where: { node: { director: { id_EQ: "$jwt.sub" } } } }]) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "5" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE ($isAuthenticated = true AND EXISTS {
                    MATCH (this0)<-[:DIRECTED]-(this2:Person)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                })
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(validate: [{ when: [BEFORE], where: { node: { director: { id_EQ: "$jwt.sub" } } } }]) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "5" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this0)<-[:DIRECTED]-(this2:Person)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow ALL", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [{ when: [BEFORE], where: { node: { director_ALL: { id_EQ: "$jwt.sub" } } } }]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "5" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (EXISTS {
                    MATCH (this0)<-[:DIRECTED]-(this2:Person)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                } AND NOT (EXISTS {
                    MATCH (this0)<-[:DIRECTED]-(this2:Person)
                    WHERE NOT ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                }))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow on connection node", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [
                            { when: [BEFORE], where: { node: { directorConnection: { node: { id_EQ: "$jwt.sub" } } } } }
                        ]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "5" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this0)<-[this2:DIRECTED]-(this3:Person)
                    WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow on connection node ALL", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [
                            {
                                when: [BEFORE]
                                where: { node: { directorConnection_ALL: { node: { id_EQ: "$jwt.sub" } } } }
                            }
                        ]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person @node {
                    id: ID
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "5" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (EXISTS {
                    MATCH (this0)<-[this2:DIRECTED]-(this3:Person)
                    WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                } AND NOT (EXISTS {
                    MATCH (this0)<-[this2:DIRECTED]-(this3:Person)
                    WHERE NOT ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                }))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "jwt": Object {
                    "roles": Array [],
                    "sub": "my-sub",
                  },
                  "param0": "something AND something",
                  "param1": "Movie",
                }
            `);
        });

        test("simple match with auth allow on connection edge", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [
                            { when: [BEFORE], where: { node: { directorConnection: { edge: { year_EQ: 2020 } } } } }
                        ]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
                }

                type Person @node {
                    id: ID
                }

                type Directed @relationshipProperties {
                    year: Int
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "5" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this0)<-[this2:DIRECTED]-(this3:Person)
                    WHERE ($param3 IS NOT NULL AND this2.year = $param3)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "param0": "something AND something",
                  "param1": "Movie",
                  "param3": 2020,
                }
            `);
        });

        test("simple match with auth allow on connection edge ALL", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }])
                    @authorization(
                        validate: [
                            { when: [BEFORE], where: { node: { directorConnection_ALL: { edge: { year_EQ: 2020 } } } } }
                        ]
                    ) {
                    title: String
                    director: [Person!]! @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
                }

                type Person @node {
                    id: ID
                }

                type Directed @relationshipProperties {
                    year: Int
                }
            `;

            const secret = "shh-its-a-secret";

            const sub = "my-sub";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const query = /* GraphQL */ `
                query {
                    movies(fulltext: { MovieTitle: { phrase: "something AND something" } }) {
                        title
                    }
                }
            `;

            const token = createBearerToken(secret, { sub });

            const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "5" });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (EXISTS {
                    MATCH (this0)<-[this2:DIRECTED]-(this3:Person)
                    WHERE ($param3 IS NOT NULL AND this2.year = $param3)
                } AND NOT (EXISTS {
                    MATCH (this0)<-[this2:DIRECTED]-(this3:Person)
                    WHERE NOT ($param3 IS NOT NULL AND this2.year = $param3)
                }))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 { .title } AS this"
            `);

            expect(result.params).toMatchInlineSnapshot(`
                Object {
                  "isAuthenticated": true,
                  "param0": "something AND something",
                  "param1": "Movie",
                  "param3": 2020,
                }
            `);
        });
    });
});
