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

describe("https://github.com/neo4j/graphql/issues/2670", () => {
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

        interface InGenre @relationshipProperties {
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
                movies(where: { genresConnection: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = true
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
                movies(where: { genresConnection: { node: { moviesAggregate: { count_LT: 3 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) < $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = true
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
                movies(where: { genresConnection: { node: { moviesAggregate: { count_GT: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) > $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = true
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
                movies(
                    where: { genresConnection: { node: { moviesAggregate: { node: { title_SHORTEST_EQUAL: 5 } } } } }
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
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN min(size(this3.title)) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = true
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 5,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where moviesAggregate node property AVERAGE", async () => {
        const query = gql`
            {
                movies(
                    where: { genresConnection: { node: { moviesAggregate: { node: { title_AVERAGE_EQUAL: 1 } } } } }
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
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN avg(size(this3.title)) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = true
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
                movies(where: { genresConnection: { node: { moviesAggregate: { edge: { intValue_MAX_LT: 983 } } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN max(this2.intValue) < $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = true
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 983,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find where moviesAggregate edge property MIN_EQUAL", async () => {
        const query = gql`
            {
                movies(
                    where: { genresConnection: { node: { moviesAggregate: { edge: { intValue_MIN_EQUAL: 1 } } } } }
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
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN min(this2.intValue) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = true
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

    test("should find where genresConnection_SOME", async () => {
        const query = gql`
            {
                movies(where: { genresConnection_SOME: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = true
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

    test("should find where genresConnection_NONE", async () => {
        const query = gql`
            {
                movies(where: { genresConnection_NONE: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = false
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

    test("should find where genresConnection_ALL", async () => {
        const query = gql`
            {
                movies(where: { genresConnection_ALL: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this6:\`IN_GENRE\`]-(this7:\`Movie\`)
                    RETURN count(this7) = $param1 AS var8
                }
                WITH *
                WHERE NOT (var8 = true)
                RETURN count(this1) > 0 AS var9
            }
            WITH *
            WHERE (var9 = false AND var5 = true)
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

    test("should find where genresConnection_SINGLE", async () => {
        const query = gql`
            {
                movies(where: { genresConnection_SINGLE: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) = 1 AS var5
            }
            WITH *
            WHERE var5 = true
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

    test("should find where genresConnection_NOT", async () => {
        const query = gql`
            {
                movies(where: { genresConnection_NOT: { node: { moviesAggregate: { count: 2 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            WITH *
            WHERE var5 = false
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

    test("should find genresConnection with multiple AND aggregates", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        genresConnection: {
                            AND: [
                                { node: { moviesAggregate: { count: 2 } } }
                                { node: { seriesAggregate: { node: { name_SHORTEST_EQUAL: 1 } } } }
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
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                CALL {
                    WITH this1
                    MATCH (this1)<-[this5:\`IN_GENRE\`]-(this6:\`Series\`)
                    RETURN min(size(this6.name)) = $param1 AS var7
                }
                WITH *
                WHERE (var4 = true AND var7 = true)
                RETURN count(this1) > 0 AS var8
            }
            WITH *
            WHERE var8 = true
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

    test("should find genresConnection with multiple OR aggregates", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        genresConnection: {
                            OR: [
                                { node: { moviesAggregate: { count: 3 } } }
                                { node: { seriesAggregate: { node: { name_SHORTEST_EQUAL: 983 } } } }
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
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                CALL {
                    WITH this1
                    MATCH (this1)<-[this5:\`IN_GENRE\`]-(this6:\`Series\`)
                    RETURN min(size(this6.name)) = $param1 AS var7
                }
                WITH *
                WHERE (var4 = true OR var7 = true)
                RETURN count(this1) > 0 AS var8
            }
            WITH *
            WHERE var8 = true
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 983,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find genresConnection with multiple implicit AND aggregates", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        genresConnection: {
                            node: {
                                moviesAggregate: { count: 2 }
                                seriesAggregate: { node: { name_SHORTEST_EQUAL: 983 } }
                            }
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
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:\`IN_GENRE\`]-(this3:\`Movie\`)
                    RETURN count(this3) = $param0 AS var4
                }
                CALL {
                    WITH this1
                    MATCH (this1)<-[this5:\`IN_GENRE\`]-(this6:\`Series\`)
                    RETURN min(size(this6.name)) = $param1 AS var7
                }
                WITH *
                WHERE (var4 = true AND var7 = true)
                RETURN count(this1) > 0 AS var8
            }
            WITH *
            WHERE var8 = true
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 983,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find genresConnection with aggregation at the same level", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        genresConnection: { node: { moviesAggregate: { count: 3 } } }
                        genresAggregate: { count: 1 }
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
                MATCH (this)-[this0:\`IN_GENRE\`]->(this1:\`Genre\`)
                RETURN count(this1) = $param0 AS var2
            }
            CALL {
                WITH this
                MATCH (this)-[this3:\`IN_GENRE\`]->(this4:\`Genre\`)
                CALL {
                    WITH this4
                    MATCH (this4)<-[this5:\`IN_GENRE\`]-(this6:\`Movie\`)
                    RETURN count(this6) = $param1 AS var7
                }
                WITH *
                WHERE var7 = true
                RETURN count(this4) > 0 AS var8
            }
            WITH *
            WHERE (var2 = true AND var8 = true)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
