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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher -> vector -> Aggregate", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @vector(indexes: [{ name: "MovieTitle", property: "movieVector" }]) {
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("simple aggregate with single vector property", async () => {
        const query = /* GraphQL */ `
            query {
                moviesAggregate(vector: { MovieTitle: { phrase: "something AND something" } }) {
                    count
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL db.index.vector.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                RETURN count(this0) AS var2
            }
            RETURN { count: var2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });
});
