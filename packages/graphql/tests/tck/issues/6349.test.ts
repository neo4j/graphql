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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/6349", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node @limit(default: 3, max: 3) {
                id: ID!
                title: String!
                releaseDate: Date
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should apply default limit to read operations", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    id
                    title
                    releaseDate
                }
            }
        `;

        const { cypher, params } = await translateQuery(neoSchema, query);

        expect(formatCypher(cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            LIMIT $param0
            RETURN this { .id, .title, .releaseDate } AS this"
        `);

        expect(formatParams(params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should not apply limit to aggregate operations", async () => {
        const query = /* GraphQL */ `
            query {
                moviesAggregate {
                    count
                }
            }
        `;

        const { cypher, params } = await translateQuery(neoSchema, query);

        expect(formatCypher(cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                RETURN count(this) AS var0
            }
            RETURN { count: var0 }"
        `);

        expect(formatParams(params)).toMatchInlineSnapshot(`"{}"`);
    });
});
