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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Label in Node directive", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor @node(additionalLabels: ["$jwt.personlabel"]) {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node(label: "$jwt.movielabel") {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("Select Movie with label Film", async () => {
        const query = gql`
            query {
                movies {
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", { movielabel: "Film" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Film\`)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Select Movie with label Film from Actors with additionalLabels", async () => {
        const query = gql`
            query {
                actors(where: { age_GT: 10 }) {
                    name
                    movies(where: { title: "terminator" }) {
                        title
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { movielabel: "Film", personlabel: "Person" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`:\`Person\`)
            WHERE this.age > $param0
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:\`Film\`)
                WHERE this1.title = $param1
                WITH this1 { .title } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { .name, movies: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": \\"terminator\\"
            }"
        `);
    });

    test("Create Movie with label Film", async () => {
        const query = gql`
            mutation {
                createMovies(input: { title: "Titanic" }) {
                    movies {
                        title
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { movielabel: "Film" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:\`Film\`)
                SET
                    create_this1.title = create_var0.title
                RETURN create_this1
            }
            RETURN collect(create_this1 { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Titanic\\"
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
