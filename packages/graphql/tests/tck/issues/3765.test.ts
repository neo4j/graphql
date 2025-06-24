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

describe("https://github.com/neo4j/graphql/issues/3765", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                otherName: String
            }
            type Post @node {
                content: String!
                alternateContent: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "likesProperties")
            }
            type likesProperties @relationshipProperties {
                someProp: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    describe("aggregation", () => {
        describe("count", () => {
            test("filter + explicit AND", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    AND: [{ count: { gt: 25 } }, { count: { lt: 33 } }]
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN count(this4) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN count(this7) < $param2 AS var8
                    }
                    WITH *
                    WHERE (var2 = true AND (var5 = true AND var8 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                                    "{
                                        \\"param0\\": {
                                            \\"low\\": 10,
                                            \\"high\\": 0
                                        },
                                        \\"param1\\": {
                                            \\"low\\": 25,
                                            \\"high\\": 0
                                        },
                                        \\"param2\\": {
                                            \\"low\\": 33,
                                            \\"high\\": 0
                                        }
                                    }"
                            `);
            });

            test("filter + implicit AND", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(where: { likesAggregate: { count: { gt: 10 }, AND: [{ count: { gt: 25, lt: 33 } }] } }) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN count(this4) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN count(this7) < $param2 AS var8
                    }
                    WITH *
                    WHERE (var2 = true AND (var5 = true AND var8 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": {
                            \\"low\\": 10,
                            \\"high\\": 0
                        },
                        \\"param1\\": {
                            \\"low\\": 25,
                            \\"high\\": 0
                        },
                        \\"param2\\": {
                            \\"low\\": 33,
                            \\"high\\": 0
                        }
                    }"
                `);
            });

            test("filter + explicit OR", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    OR: [{ count: { gt: 25 } }, { count: { lt: 33 } }]
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN count(this4) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN count(this7) < $param2 AS var8
                    }
                    WITH *
                    WHERE (var2 = true AND (var5 = true OR var8 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                                    "{
                                        \\"param0\\": {
                                            \\"low\\": 10,
                                            \\"high\\": 0
                                        },
                                        \\"param1\\": {
                                            \\"low\\": 25,
                                            \\"high\\": 0
                                        },
                                        \\"param2\\": {
                                            \\"low\\": 33,
                                            \\"high\\": 0
                                        }
                                    }"
                            `);
            });

            test("filter + explicit OR which contains an implicit AND", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    OR: [{ count: { gt: 25, lte: 99 } }, { count: { lt: 33 } }]
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN count(this4) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN count(this7) <= $param2 AS var8
                    }
                    CALL (this) {
                        MATCH (this)<-[this9:LIKES]-(this10:User)
                        RETURN count(this10) < $param3 AS var11
                    }
                    WITH *
                    WHERE (var2 = true AND ((var5 = true AND var8 = true) OR var11 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": {
                            \\"low\\": 10,
                            \\"high\\": 0
                        },
                        \\"param1\\": {
                            \\"low\\": 25,
                            \\"high\\": 0
                        },
                        \\"param2\\": {
                            \\"low\\": 99,
                            \\"high\\": 0
                        },
                        \\"param3\\": {
                            \\"low\\": 33,
                            \\"high\\": 0
                        }
                    }"
                `);
            });

            test("filter + explicit OR which contains an explicit AND", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    OR: [
                                        { AND: [{ count: { gt: 25 } }, { count: { lte: 99 } }] }
                                        { count: { lt: 33 } }
                                    ]
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN count(this4) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN count(this7) <= $param2 AS var8
                    }
                    CALL (this) {
                        MATCH (this)<-[this9:LIKES]-(this10:User)
                        RETURN count(this10) < $param3 AS var11
                    }
                    WITH *
                    WHERE (var2 = true AND ((var5 = true AND var8 = true) OR var11 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                                    "{
                                        \\"param0\\": {
                                            \\"low\\": 10,
                                            \\"high\\": 0
                                        },
                                        \\"param1\\": {
                                            \\"low\\": 25,
                                            \\"high\\": 0
                                        },
                                        \\"param2\\": {
                                            \\"low\\": 99,
                                            \\"high\\": 0
                                        },
                                        \\"param3\\": {
                                            \\"low\\": 33,
                                            \\"high\\": 0
                                        }
                                    }"
                            `);
            });
        });

        describe("node/edge", () => {
            test("count filter + explicit node AND", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    node: {
                                        AND: [
                                            { name: { shortestLength: { gt: 25 } } }
                                            { name: { shortestLength: { lt: 80 } } }
                                        ]
                                    }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN min(size(this4.name)) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN min(size(this7.name)) < $param2 AS var8
                    }
                    WITH *
                    WHERE (var2 = true AND (var5 = true AND var8 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": {
                            \\"low\\": 10,
                            \\"high\\": 0
                        },
                        \\"param1\\": {
                            \\"low\\": 25,
                            \\"high\\": 0
                        },
                        \\"param2\\": {
                            \\"low\\": 80,
                            \\"high\\": 0
                        }
                    }"
                `);
            });

            test("count filter + implicit node AND", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    node: { AND: [{ name: { shortestLength: { gt: 25, lt: 80 } } }] }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN min(size(this4.name)) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN min(size(this7.name)) < $param2 AS var8
                    }
                    WITH *
                    WHERE (var2 = true AND (var5 = true AND var8 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": {
                            \\"low\\": 10,
                            \\"high\\": 0
                        },
                        \\"param1\\": {
                            \\"low\\": 25,
                            \\"high\\": 0
                        },
                        \\"param2\\": {
                            \\"low\\": 80,
                            \\"high\\": 0
                        }
                    }"
                `);
            });

            test("count filter + explicit node OR", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    node: {
                                        OR: [
                                            { name: { shortestLength: { gt: 25 } } }
                                            { name: { shortestLength: { lt: 80 } } }
                                        ]
                                    }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN min(size(this4.name)) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN min(size(this7.name)) < $param2 AS var8
                    }
                    WITH *
                    WHERE (var2 = true AND (var5 = true OR var8 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": {
                            \\"low\\": 10,
                            \\"high\\": 0
                        },
                        \\"param1\\": {
                            \\"low\\": 25,
                            \\"high\\": 0
                        },
                        \\"param2\\": {
                            \\"low\\": 80,
                            \\"high\\": 0
                        }
                    }"
                `);
            });

            test("count filter + explicit node OR which contains an explicit AND", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    node: {
                                        OR: [
                                            { name: { shortestLength: { gt: 25, lt: 40 } } }
                                            { name: { shortestLength: { gte: 1233 } } }
                                        ]
                                    }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN min(size(this4.name)) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN min(size(this7.name)) < $param2 AS var8
                    }
                    CALL (this) {
                        MATCH (this)<-[this9:LIKES]-(this10:User)
                        RETURN min(size(this10.name)) >= $param3 AS var11
                    }
                    WITH *
                    WHERE (var2 = true AND ((var5 = true AND var8 = true) OR var11 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": {
                            \\"low\\": 10,
                            \\"high\\": 0
                        },
                        \\"param1\\": {
                            \\"low\\": 25,
                            \\"high\\": 0
                        },
                        \\"param2\\": {
                            \\"low\\": 40,
                            \\"high\\": 0
                        },
                        \\"param3\\": {
                            \\"low\\": 1233,
                            \\"high\\": 0
                        }
                    }"
                `);
            });

            test("count filter + complex mixing between edge/node filter", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(
                            where: {
                                likesAggregate: {
                                    count: { gt: 10 }
                                    OR: [
                                        {
                                            edge: { someProp: { shortestLength: { lt: 10 }, longestLength: { gt: 4 } } }
                                            node: { name: { averageLength: { gt: 3782 } } }
                                        }
                                        { node: { name: { shortestLength: { gt: 25 } } } }
                                    ]
                                    edge: { someProp: { longestLength: { lt: 12 }, shortestLength: { gt: 20 } } }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Post)
                    CALL (this) {
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN count(this1) > $param0 AS var2
                    }
                    CALL (this) {
                        MATCH (this)<-[this3:LIKES]-(this4:User)
                        RETURN avg(size(this4.name)) > $param1 AS var5
                    }
                    CALL (this) {
                        MATCH (this)<-[this6:LIKES]-(this7:User)
                        RETURN min(size(this6.someProp)) < $param2 AS var8
                    }
                    CALL (this) {
                        MATCH (this)<-[this9:LIKES]-(this10:User)
                        RETURN max(size(this9.someProp)) > $param3 AS var11
                    }
                    CALL (this) {
                        MATCH (this)<-[this12:LIKES]-(this13:User)
                        RETURN min(size(this13.name)) > $param4 AS var14
                    }
                    CALL (this) {
                        MATCH (this)<-[this15:LIKES]-(this16:User)
                        RETURN min(size(this15.someProp)) > $param5 AS var17
                    }
                    CALL (this) {
                        MATCH (this)<-[this18:LIKES]-(this19:User)
                        RETURN max(size(this18.someProp)) < $param6 AS var20
                    }
                    WITH *
                    WHERE (var2 = true AND ((var5 = true AND (var8 = true AND var11 = true)) OR var14 = true) AND (var17 = true AND var20 = true))
                    RETURN this { .content } AS this"
                `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": {
                            \\"low\\": 10,
                            \\"high\\": 0
                        },
                        \\"param1\\": 3782,
                        \\"param2\\": {
                            \\"low\\": 10,
                            \\"high\\": 0
                        },
                        \\"param3\\": {
                            \\"low\\": 4,
                            \\"high\\": 0
                        },
                        \\"param4\\": {
                            \\"low\\": 25,
                            \\"high\\": 0
                        },
                        \\"param5\\": {
                            \\"low\\": 20,
                            \\"high\\": 0
                        },
                        \\"param6\\": {
                            \\"low\\": 12,
                            \\"high\\": 0
                        }
                    }"
                `);
            });
        });
    });

    describe("property filters", () => {
        test("implicit AND", async () => {
            const query = /* GraphQL */ `
                {
                    posts(where: { content: { eq: "stuff" }, alternateContent: { eq: "stuff2" } }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Post)
                WHERE (this.content = $param0 AND this.alternateContent = $param1)
                RETURN this { .content } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"stuff\\",
                    \\"param1\\": \\"stuff2\\"
                }"
            `);
        });

        test("explicit OR with an implicit AND", async () => {
            const query = /* GraphQL */ `
                {
                    posts(
                        where: {
                            OR: [
                                { content: { eq: "stuff" }, alternateContent: { eq: "stuff2" } }
                                { content: { eq: "stuff3" } }
                            ]
                        }
                    ) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Post)
                WHERE ((this.content = $param0 AND this.alternateContent = $param1) OR this.content = $param2)
                RETURN this { .content } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"stuff\\",
                    \\"param1\\": \\"stuff2\\",
                    \\"param2\\": \\"stuff3\\"
                }"
            `);
        });

        test("explicit NOT with an implicit AND", async () => {
            const query = /* GraphQL */ `
                {
                    posts(where: { NOT: { content: { eq: "stuff" }, alternateContent: { eq: "stuff2" } } }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Post)
                WHERE NOT (this.content = $param0 AND this.alternateContent = $param1)
                RETURN this { .content } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"stuff\\",
                    \\"param1\\": \\"stuff2\\"
                }"
            `);
        });
    });

    describe("relationship filters", () => {
        test("implicit AND  inside relationship filter", async () => {
            const query = /* GraphQL */ `
                {
                    posts(where: { likes: { some: { name: { eq: "stuff" }, otherName: { eq: "stuff2" } } } }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Post)
                WHERE EXISTS {
                    MATCH (this)<-[:LIKES]-(this0:User)
                    WHERE (this0.name = $param0 AND this0.otherName = $param1)
                }
                RETURN this { .content } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"stuff\\",
                    \\"param1\\": \\"stuff2\\"
                }"
            `);
        });

        test("implicit AND outside relationship filters", async () => {
            const query = /* GraphQL */ `
                {
                    posts(where: { likes: { some: { name: { eq: "stuff" } }, all: { otherName: { eq: "stuff2" } } } }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Post)
                WHERE ((EXISTS {
                    MATCH (this)<-[:LIKES]-(this0:User)
                    WHERE this0.otherName = $param0
                } AND NOT (EXISTS {
                    MATCH (this)<-[:LIKES]-(this0:User)
                    WHERE NOT (this0.otherName = $param0)
                })) AND EXISTS {
                    MATCH (this)<-[:LIKES]-(this1:User)
                    WHERE this1.name = $param1
                })
                RETURN this { .content } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"stuff2\\",
                    \\"param1\\": \\"stuff\\"
                }"
            `);
        });

        test("explicit OR outside relationship filters", async () => {
            const query = /* GraphQL */ `
                {
                    posts(
                        where: {
                            OR: [
                                { likes: { some: { name: { eq: "stuff" } } } }
                                { likes: { all: { otherName: { eq: "stuff2" } } } }
                                { likes: { some: { otherName: { eq: "stuff3" } } } }
                            ]
                        }
                    ) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Post)
                WHERE (EXISTS {
                    MATCH (this)<-[:LIKES]-(this0:User)
                    WHERE this0.name = $param0
                } OR (EXISTS {
                    MATCH (this)<-[:LIKES]-(this1:User)
                    WHERE this1.otherName = $param1
                } AND NOT (EXISTS {
                    MATCH (this)<-[:LIKES]-(this1:User)
                    WHERE NOT (this1.otherName = $param1)
                })) OR EXISTS {
                    MATCH (this)<-[:LIKES]-(this2:User)
                    WHERE this2.otherName = $param2
                })
                RETURN this { .content } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"stuff\\",
                    \\"param1\\": \\"stuff2\\",
                    \\"param2\\": \\"stuff3\\"
                }"
            `);
        });
    });
});
