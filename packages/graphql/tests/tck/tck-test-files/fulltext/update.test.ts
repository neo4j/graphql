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
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher -> fulltext -> Update", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }]) {
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("simple update with search on property", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    search: { MovieTitle: { phrase: "something AND something" } }
                    update: { title: "something else and something else" }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(
                \\"MovieTitle\\",
                $this_search_MovieTitle_phrase
            ) YIELD node as this, score as score
            SET this.title = $this_update_title
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_search_MovieTitle_phrase\\": \\"something AND something\\",
                \\"this_update_title\\": \\"something else and something else\\"
            }"
        `);
    });
});
