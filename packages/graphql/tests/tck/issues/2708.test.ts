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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2708", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = gql`
        type Movie {
            title: String
            genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "InGenre")
        }

        type Genre {
            name: String
            movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN, properties: "InGenre")
            series: [Series!]! @relationship(type: "IN_GENRE", direction: IN, properties: "InGenre")
        }

        type Series {
            name: String!
            genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "InGenre")
        }

        interface InGenre {
            intValue: Int!
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should find where moviesAggregate count equal", async () => {
        const query = gql`
            {
                movies(where: { genres: { moviesAggregate: { count: 2 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
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
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where moviesAggregate count_LT", async () => {
        const query = gql`
            {
                movies(where: { genres: { moviesAggregate: { count_LT: 3 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) < $param0 AS var3
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
                    \\"low\\": 3,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where moviesAggregate count_GT", async () => {
        const query = gql`
            {
                movies(where: { genres: { moviesAggregate: { count_GT: 2 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) > $param0 AS var3
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
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where moviesAggregate node property SHORTEST", async () => {
        const query = gql`
            {
                movies(where: { genres: { moviesAggregate: { node: { title_SHORTEST_EQUAL: 1 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN min(size(this2.\`title\`)) = $param0 AS var3
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
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where moviesAggregate node property AVERAGE", async () => {
        const query = gql`
            {
                movies(where: { genres: { moviesAggregate: { node: { title_AVERAGE_EQUAL: 1 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN avg(size(this2.\`title\`)) = $param0 AS var3
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
                \\"param0\\": 1
            }"
        `);
    });

    test("should find where moviesAggregate edge property MAX_LT", async () => {
        const query = gql`
            {
                movies(where: { genres: { moviesAggregate: { edge: { intValue_MAX_LT: 1 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN max(this1.\`intValue\`) < $param0 AS var3
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
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where moviesAggregate edge property MIN_EQUAL", async () => {
        const query = gql`
            {
                movies(where: { genres: { moviesAggregate: { edge: { intValue_MIN_EQUAL: 1 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN min(this1.\`intValue\`) = $param0 AS var3
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
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where genres_SOME", async () => {
        const query = gql`
            {
                movies(where: { genres_SOME: { moviesAggregate: { count: 2 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
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
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where genres_NONE", async () => {
        const query = gql`
            {
                movies(where: { genres_NONE: { moviesAggregate: { count: 2 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                WITH *
                WHERE var3 = true
                RETURN count(this0) > 0 AS var4
            }
            WITH *
            WHERE var4 = false
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where genres_ALL", async () => {
        const query = gql`
            {
                movies(where: { genres_ALL: { moviesAggregate: { count: 2 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                WITH *
                WHERE var3 = true
                RETURN count(this0) > 0 AS var4
            }
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this5:\`IN_GENRE\`]-(this6:\`Movie\`)
                    RETURN count(this6) = $param1 AS var7
                }
                WITH *
                WHERE NOT (var7 = true)
                RETURN count(this0) > 0 AS var8
            }
            WITH *
            WHERE (var8 = false AND var4 = true)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where genres_SINGLE", async () => {
        const query = gql`
            {
                movies(where: { genres_SINGLE: { moviesAggregate: { count: 2 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                WITH *
                WHERE var3 = true
                RETURN count(this0) = 1 AS var4
            }
            WITH *
            WHERE var4 = true
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where genres_NOT", async () => {
        const query = gql`
            {
                movies(where: { genres_NOT: { moviesAggregate: { count: 2 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                WITH *
                WHERE var3 = true
                RETURN count(this0) > 0 AS var4
            }
            WITH *
            WHERE var4 = false
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should not find genres_ALL where NONE true", async () => {
        const query = gql`
            {
                movies(where: { genres_ALL: { moviesAggregate: { count: 0 } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                WITH *
                WHERE var3 = true
                RETURN count(this0) > 0 AS var4
            }
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this5:\`IN_GENRE\`]-(this6:\`Movie\`)
                    RETURN count(this6) = $param1 AS var7
                }
                WITH *
                WHERE NOT (var7 = true)
                RETURN count(this0) > 0 AS var8
            }
            WITH *
            WHERE (var8 = false AND var4 = true)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find genres with multiple AND aggregates", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        genres: {
                            AND: [
                                { moviesAggregate: { count: 2 } }
                                { seriesAggregate: { node: { name_SHORTEST_EQUAL: 1 } } }
                            ]
                        }
                    }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[this4:\`IN_GENRE\`]-(this5:\`Series\`)
                    RETURN min(size(this5.\`name\`)) = $param1 AS var6
                }
                WITH *
                WHERE (var3 = true AND var6 = true)
                RETURN count(this0) > 0 AS var7
            }
            WITH *
            WHERE var7 = true
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find genres with multiple OR aggregates", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        genres: {
                            OR: [
                                { moviesAggregate: { count: 3 } }
                                { seriesAggregate: { node: { name_SHORTEST_EQUAL: 1 } } }
                            ]
                        }
                    }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[this4:\`IN_GENRE\`]-(this5:\`Series\`)
                    RETURN min(size(this5.\`name\`)) = $param1 AS var6
                }
                WITH *
                WHERE (var3 = true OR var6 = true)
                RETURN count(this0) > 0 AS var7
            }
            WITH *
            WHERE var7 = true
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find genres with multiple implicit AND aggregates", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        genres: { moviesAggregate: { count: 2 }, seriesAggregate: { node: { name_SHORTEST_EQUAL: 1 } } }
                    }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[this4:\`IN_GENRE\`]-(this5:\`Series\`)
                    RETURN min(size(this5.\`name\`)) = $param1 AS var6
                }
                WITH *
                WHERE (var3 = true AND var6 = true)
                RETURN count(this0) > 0 AS var7
            }
            WITH *
            WHERE var7 = true
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find genres with aggregation at the same level", async () => {
        const query = gql`
            {
                movies(where: { genres: { moviesAggregate: { count: 3 } }, genresAggregate: { count: 1 } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[:\`IN_GENRE\`]->(this0:\`Genre\`)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:\`IN_GENRE\`]-(this2:\`Movie\`)
                    RETURN count(this2) = $param0 AS var3
                }
                WITH *
                WHERE var3 = true
                RETURN count(this0) > 0 AS var4
            }
            CALL {
                WITH this
                MATCH (this)-[this5:\`IN_GENRE\`]->(this6:\`Genre\`)
                RETURN count(this6) = $param1 AS var7
            }
            WITH *
            WHERE (var4 = true AND var7 = true)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
