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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

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
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:Film)
            WHERE this.title = $this_title
            RETURN this { search:  [this_search IN [(this)-[:SEARCH]->(this_search) WHERE (\\"Category\\" IN labels(this_search) AND \\"ExtraLabel1\\" IN labels(this_search) AND \\"ExtraLabel2\\" IN labels(this_search)) OR (\\"Film\\" IN labels(this_search)) | head( [ this_search IN [this_search] WHERE (\\"Category\\" IN labels(this_search) AND \\"ExtraLabel1\\" IN labels(this_search) AND \\"ExtraLabel2\\" IN labels(this_search)) AND this_search.name = $this_search_Genre_name | this_search { __resolveType: \\"Genre\\",  .name } ] + [ this_search IN [this_search] WHERE (\\"Film\\" IN labels(this_search)) AND this_search.title = $this_search_Movie_title | this_search { __resolveType: \\"Movie\\",  .title } ] ) ] WHERE this_search IS NOT NULL] [1..11]  } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some title\\",
                \\"this_search_Genre_name\\": \\"Horror\\",
                \\"this_search_Movie_title\\": \\"The Matrix\\"
            }"
        `);
    });
});
