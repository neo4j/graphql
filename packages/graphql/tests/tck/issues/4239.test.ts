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

describe("https://github.com/neo4j/graphql/issues/4239", () => {
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

    test("should produce a predicate for apoc.util.validatePredicate for version 4.4", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(
                    validate: [
                        { when: [BEFORE], where: { node: { directorConnection: { node: { id: "$jwt.sub" } } } } }
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
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken(secret, { sub });

        const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)<-[this1:DIRECTED]-(this0:Person) WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(result.params).toMatchInlineSnapshot(`
                    Object {
                      "isAuthenticated": true,
                      "jwt": Object {
                        "roles": Array [],
                        "sub": "my-sub",
                      },
                    }
            `);
    });

    test("should produce a predicate for apoc.util.validatePredicate for version 4.4 (simple API)", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(validate: [{ when: [BEFORE], where: { node: { director_SOME: { id: "$jwt.sub" } } } }]) {
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
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken(secret, { sub });

        const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "4.4" });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)<-[:DIRECTED]-(this0:Person) WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(result.params).toMatchInlineSnapshot(`
            Object {
              "isAuthenticated": true,
              "jwt": Object {
                "roles": Array [],
                "sub": "my-sub",
              },
            }
        `);
    });

    test("should produce a predicate for apoc.util.validatePredicate for version 5.0", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(
                    validate: [
                        { when: [BEFORE], where: { node: { directorConnection: { node: { id: "$jwt.sub" } } } } }
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
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken(secret, { sub });

        const result = await translateQuery(neoSchema, query, { token, neo4jVersion: "5.0" });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[this0:DIRECTED]-(this1:Person)
                WHERE ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(result.params).toMatchInlineSnapshot(`
            Object {
              "isAuthenticated": true,
              "jwt": Object {
                "roles": Array [],
                "sub": "my-sub",
              },
            }
        `);
    });
});
