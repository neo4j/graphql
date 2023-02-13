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

describe("Node directive with unions", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            union Search = Movie | Genre

            type Genre @node(label: "Category", additionalLabels: ["ExtraLabel1", "ExtraLabel2"]) {
                name: String
            }

            type Movie @node(label: "Film") {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("Read Unions", async () => {
        const query = gql`
            {
                movies(where: { title: "some title" }) {
                    search(
                        where: { Movie: { title: "The Matrix" }, Genre: { name: "Horror" } }
                        options: { offset: 1, limit: 10 }
                    ) {
                        ... on Movie {
                            title
                        }
                        ... on Genre {
                            name
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
            "MATCH (this:\`Film\`)
            WHERE this.title = $param0
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:SEARCH]->(this_search:\`Category\`:\`ExtraLabel1\`:\`ExtraLabel2\`)
                    WHERE this_search.name = $param1
                    WITH this_search { __resolveType: \\"Genre\\" ,  .name } AS this_search
                    RETURN this_search AS this_search
                    UNION
                    WITH *
                    MATCH (this)-[this1:SEARCH]->(this_search:\`Film\`)
                    WHERE this_search.title = $param2
                    WITH this_search { __resolveType: \\"Movie\\" ,  .title } AS this_search
                    RETURN this_search AS this_search
                }
                WITH this_search
                SKIP $param3
                LIMIT $param4
                RETURN collect(this_search) AS this_search
            }
            RETURN this { search: this_search } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": \\"Horror\\",
                \\"param2\\": \\"The Matrix\\",
                \\"param3\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param4\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
