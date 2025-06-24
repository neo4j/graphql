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

describe("https://github.com/neo4j/graphql/issues/6005", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Actor @node {
                name: String!
                age: Int!
                born: DateTime!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
            type ActedIn @relationshipProperties {
                screentime: Int!
                character: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("filter movies by actors count with duplicate results (deprecated syntax, no DISTINCT)", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { actorsAggregate: { count: { eq: 4 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                RETURN count(this1) = $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 4,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("filter movies by actors count with duplicate results at the field-level", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    movies(where: { actorsAggregate: { count: { eq: 4 } } }) {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            CALL (this) {
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH DISTINCT this1
                CALL (this1) {
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                WITH this1 { .title } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { movies: var5 } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 4,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("filter movies by related movies count with duplicate results, double nested", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { actors: { some: { moviesAggregate: { count: { eq: 4 } } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                MATCH (this)<-[:ACTED_IN]-(this0:Actor)
                CALL (this0) {
                    MATCH (this0)-[this1:ACTED_IN]->(this2:Movie)
                    RETURN count(this2) = $param0 AS var3
                }
                WITH *
                WHERE var3 = true
                RETURN count(this0) > 0 AS var4
            }
            WITH *
            WHERE var4 = true
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 4,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
