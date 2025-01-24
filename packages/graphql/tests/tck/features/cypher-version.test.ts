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
import { formatCypher, translateQuery } from "../utils/tck-test-utils";

describe("Cypher version", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String!
            }

            type Movie @node {
                id: ID
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                addCypherVersion: true,
            },
        });
    });

    test("Read query", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title_EQ: "River Runs Through It, A" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);
    });

    test("Read connection", async () => {
        const query = /* GraphQL */ `
            query ActorsConnection {
                actorsConnection {
                    totalCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this0:Actor)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { __id: id(this0), __resolveType: \\"Actor\\" } }) AS var1
            }
            RETURN { edges: var1, totalCount: totalCount } AS this"
        `);
    });

    test("Aggregate", async () => {
        const query = /* GraphQL */ `
            {
                moviesAggregate {
                    count
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this:Movie)
                RETURN count(this) AS var0
            }
            RETURN { count: var0 }"
        `);
    });

    test("Create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "dsa" }]) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.title = create_var0.title
                RETURN create_this1
            }
            RETURN collect(create_this1 { .title }) AS data"
        `);
    });
    test("Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { title_SET: "Potato" }) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            SET this.title = $this_update_title_SET
            RETURN collect(DISTINCT this { .title }) AS data"
        `);
    });

    test("Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteActors {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            DETACH DELETE this"
        `);
    });
});
