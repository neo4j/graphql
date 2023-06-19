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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../src";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("Cypher Arrays", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                title: String!
                ratings: [Float!]!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("WHERE INCLUDES", async () => {
        const query = gql`
            {
                movies(where: { ratings_INCLUDES: 4.0 }) {
                    title
                    ratings
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE $param0 IN this.ratings
            RETURN this { .title, .ratings } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 4
            }"
        `);
    });

    test("WHERE NOT INCLUDES", async () => {
        const query = gql`
            {
                movies(where: { ratings_NOT_INCLUDES: 4.0 }) {
                    title
                    ratings
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE NOT ($param0 IN this.ratings)
            RETURN this { .title, .ratings } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 4
            }"
        `);
    });
});
