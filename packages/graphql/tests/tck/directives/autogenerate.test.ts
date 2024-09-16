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

describe("Cypher autogenerate directive", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie {
                id: ID! @id @unique
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ name: "dan" }]) {
                    movies {
                        id
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.id = randomUUID(),
                    create_this1.name = create_var0.name
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id, .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"name\\": \\"dan\\"
                    }
                ]
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { name: "dan" }) {
                    movies {
                        id
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            SET this.name = $this_update_name
            RETURN collect(DISTINCT this { .id, .name }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_name\\": \\"dan\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
