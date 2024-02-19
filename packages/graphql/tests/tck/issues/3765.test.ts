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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/3765", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User {
                name: String!
                otherName: String
            }
            type Post {
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
                        posts(where: { likesAggregate: { count_GT: 10, AND: [{ count_GT: 25 }, { count_LT: 33 }] } }) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                                    "MATCH (this:Post)
                                    CALL {
                                        WITH this
                                        MATCH (this)<-[this0:LIKES]-(this1:User)
                                        RETURN (count(this1) > $param0 AND (count(this1) > $param1 AND count(this1) < $param2)) AS var2
                                    }
                                    WITH *
                                    WHERE var2 = true
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
                        posts(where: { likesAggregate: { count_GT: 10, AND: [{ count_GT: 25, count_LT: 33 }] } }) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                                    "MATCH (this:Post)
                                    CALL {
                                        WITH this
                                        MATCH (this)<-[this0:LIKES]-(this1:User)
                                        RETURN (count(this1) > $param0 AND (count(this1) < $param1 AND count(this1) > $param2)) AS var2
                                    }
                                    WITH *
                                    WHERE var2 = true
                                    RETURN this { .content } AS this"
                            `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                                    "{
                                        \\"param0\\": {
                                            \\"low\\": 10,
                                            \\"high\\": 0
                                        },
                                        \\"param1\\": {
                                            \\"low\\": 33,
                                            \\"high\\": 0
                                        },
                                        \\"param2\\": {
                                            \\"low\\": 25,
                                            \\"high\\": 0
                                        }
                                    }"
                            `);
            });

            test("filter + explicit OR", async () => {
                const query = /* GraphQL */ `
                    {
                        posts(where: { likesAggregate: { count_GT: 10, OR: [{ count_GT: 25 }, { count_LT: 33 }] } }) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                                    "MATCH (this:Post)
                                    CALL {
                                        WITH this
                                        MATCH (this)<-[this0:LIKES]-(this1:User)
                                        RETURN (count(this1) > $param0 AND (count(this1) > $param1 OR count(this1) < $param2)) AS var2
                                    }
                                    WITH *
                                    WHERE var2 = true
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
                                    count_GT: 10
                                    OR: [{ count_GT: 25, count_LTE: 99 }, { count_LT: 33 }]
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                                    "MATCH (this:Post)
                                    CALL {
                                        WITH this
                                        MATCH (this)<-[this0:LIKES]-(this1:User)
                                        RETURN (count(this1) > $param0 AND ((count(this1) <= $param1 AND count(this1) > $param2) OR count(this1) < $param3)) AS var2
                                    }
                                    WITH *
                                    WHERE var2 = true
                                    RETURN this { .content } AS this"
                            `);

                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                                    "{
                                        \\"param0\\": {
                                            \\"low\\": 10,
                                            \\"high\\": 0
                                        },
                                        \\"param1\\": {
                                            \\"low\\": 99,
                                            \\"high\\": 0
                                        },
                                        \\"param2\\": {
                                            \\"low\\": 25,
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
                                    count_GT: 10
                                    OR: [{ AND: [{ count_GT: 25 }, { count_LTE: 99 }] }, { count_LT: 33 }]
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                                    "MATCH (this:Post)
                                    CALL {
                                        WITH this
                                        MATCH (this)<-[this0:LIKES]-(this1:User)
                                        RETURN (count(this1) > $param0 AND ((count(this1) > $param1 AND count(this1) <= $param2) OR count(this1) < $param3)) AS var2
                                    }
                                    WITH *
                                    WHERE var2 = true
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
                                    count_GT: 10
                                    node: { AND: [{ name_SHORTEST_GT: 25 }, { name_SHORTEST_LT: 80 }] }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Post)
                    CALL {
                        WITH this
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN (count(this1) > $param0 AND (min(size(this1.name)) > $param1 AND min(size(this1.name)) < $param2)) AS var2
                    }
                    WITH *
                    WHERE var2 = true
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
                                    count_GT: 10
                                    node: { AND: [{ name_SHORTEST_GT: 25, name_SHORTEST_LT: 80 }] }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Post)
                    CALL {
                        WITH this
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN (count(this1) > $param0 AND (min(size(this1.name)) > $param1 AND min(size(this1.name)) < $param2)) AS var2
                    }
                    WITH *
                    WHERE var2 = true
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
                                    count_GT: 10
                                    node: { OR: [{ name_SHORTEST_GT: 25 }, { name_SHORTEST_LT: 80 }] }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Post)
                    CALL {
                        WITH this
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN (count(this1) > $param0 AND (min(size(this1.name)) > $param1 OR min(size(this1.name)) < $param2)) AS var2
                    }
                    WITH *
                    WHERE var2 = true
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
                                    count_GT: 10
                                    node: {
                                        OR: [
                                            { name_SHORTEST_GT: 25, name_SHORTEST_LT: 40 }
                                            { name_SHORTEST_GTE: 1233 }
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
                    "MATCH (this:Post)
                    CALL {
                        WITH this
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN (count(this1) > $param0 AND ((min(size(this1.name)) > $param1 AND min(size(this1.name)) < $param2) OR min(size(this1.name)) >= $param3)) AS var2
                    }
                    WITH *
                    WHERE var2 = true
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
                                    count_GT: 10
                                    OR: [
                                        {
                                            edge: { someProp_LONGEST_GT: 4, someProp_SHORTEST_LT: 10 }
                                            node: { name_AVERAGE_GT: 3782 }
                                        }
                                        { node: { name_SHORTEST_GT: 25 } }
                                    ]
                                    edge: { someProp_LONGEST_LT: 12, someProp_SHORTEST_GT: 20 }
                                }
                            }
                        ) {
                            content
                        }
                    }
                `;

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Post)
                    CALL {
                        WITH this
                        MATCH (this)<-[this0:LIKES]-(this1:User)
                        RETURN (count(this1) > $param0 AND ((avg(size(this1.name)) > $param1 AND (max(size(this0.someProp)) > $param2 AND min(size(this0.someProp)) < $param3)) OR min(size(this1.name)) > $param4) AND (min(size(this0.someProp)) > $param5 AND max(size(this0.someProp)) < $param6)) AS var2
                    }
                    WITH *
                    WHERE var2 = true
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
                            \\"low\\": 4,
                            \\"high\\": 0
                        },
                        \\"param3\\": {
                            \\"low\\": 10,
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
                    posts(where: { content: "stuff", alternateContent: "stuff2" }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Post)
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
                    posts(where: { OR: [{ content: "stuff", alternateContent: "stuff2" }, { content: "stuff3" }] }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Post)
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
                    posts(where: { NOT: { content: "stuff", alternateContent: "stuff2" } }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Post)
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
                    posts(where: { likes_SOME: { name: "stuff", otherName: "stuff2" } }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Post)
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
                    posts(where: { likes_SOME: { name: "stuff" }, likes_ALL: { otherName: "stuff2" } }) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Post)
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
                                { likes_SOME: { name: "stuff" } }
                                { likes_ALL: { otherName: "stuff2" } }
                                { likes_SOME: { otherName: "stuff3" } }
                            ]
                        }
                    ) {
                        content
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Post)
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
