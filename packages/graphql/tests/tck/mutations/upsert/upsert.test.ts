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

describe("Upsert", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor {
                name: String!
            }

            type Movie {
                title: String!
                released: Int
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Top level upsert", async () => {
        const query = /* GraphQL */ `
            mutation {
                upsertMovies(input: [{ node: { title: "The Matrix" } }]) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MERGE (this0:Movie { title: $param0 })
            WITH [this0] AS var1
            UNWIND var1 AS this
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("Top level upsert with multiple properties", async () => {
        const query = /* GraphQL */ `
            mutation {
                upsertMovies(input: [{ node: { title: "The Matrix", released: 1999 } }]) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MERGE (this0:Movie { title: $param0, released: $param1 })
            WITH [this0] AS var1
            UNWIND var1 AS this
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Top level upsert with onCreate", async () => {
        const query = /* GraphQL */ `
            mutation {
                upsertMovies(input: [{ node: { title: "The Matrix" }, onCreate: { released: 1999 } }]) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MERGE (this0:Movie { title: $param0 })
            ON CREATE SET
                this0.released = $param1
            WITH [this0] AS var1
            UNWIND var1 AS this
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                }
            }"
        `);
    });
    test("Top level upsert with onUpdate", async () => {
        const query = /* GraphQL */ `
            mutation {
                upsertMovies(input: [{ node: { title: "The Matrix" }, onUpdate: { released: 1999 } }]) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MERGE (this0:Movie { title: $param0 })
            ON MATCH SET
                this0.released = $param1
            WITH [this0] AS var1
            UNWIND var1 AS this
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                }
            }"
        `);
    });
    test("Top level upsert with onCreate and onUpdate", async () => {
        const query = /* GraphQL */ `
            mutation {
                upsertMovies(
                    input: [
                        {
                            node: { title: "The Matrix" }
                            onCreate: { released: 1999 }
                            onUpdate: { title: "Another Matrix" }
                        }
                    ]
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MERGE (this0:Movie { title: $param0 })
            ON MATCH SET
                this0.title = $param2
            ON CREATE SET
                this0.released = $param1
            WITH [this0] AS var1
            UNWIND var1 AS this
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                },
                \\"param2\\": \\"Another Matrix\\"
            }"
        `);
    });
});
