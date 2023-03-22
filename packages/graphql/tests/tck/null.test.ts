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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../src";
import { createJwtRequest } from "../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("Cypher NULL", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                isFavorite: Boolean
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });
    });

    test("Simple IS NULL", async () => {
        const query = gql`
            query {
                movies(where: { title: null }) {
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title IS NULL
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple IS NOT NULL", async () => {
        const query = gql`
            query {
                movies(where: { title_NOT: null }) {
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title IS NOT NULL
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple relationship IS NULL", async () => {
        const query = gql`
            query {
                movies(where: { actors: null }) {
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE NOT (EXISTS {
                MATCH (this)<-[:ACTED_IN]-(this0:\`Actor\`)
            })
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple relationship IS NOT NULL", async () => {
        const query = gql`
            query {
                movies(where: { actors_NOT: null }) {
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE EXISTS {
                MATCH (this)<-[:ACTED_IN]-(this0:\`Actor\`)
            }
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
