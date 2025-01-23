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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Cypher Advanced Filtering", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                _id: ID
                id: ID
                title: String
                actorCount: Int
                budget: BigInt
                genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
            }

            type Genre @node {
                name: String
                movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                filters: {
                    String: {
                        LT: true,
                        GT: true,
                        LTE: true,
                        GTE: true,
                        MATCHES: true,
                    },
                    ID: {
                        MATCHES: true,
                    },
                },
            },
        });
    });

    test("equals", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title: { eq: "The Matrix" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("in", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { _id: { in: ["123"] } }) {
                    _id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this._id IN $param0
            RETURN this { ._id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"123\\"
                ]
            }"
        `);
    });

    test("matches", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id: { matches: "(?i)123.*" } }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.id =~ $param0
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"(?i)123.*\\"
            }"
        `);
    });

    test("NOT", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { NOT: { id: { eq: "123" } } }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE NOT (this.id = $param0)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

    test("contains", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id: { contains: "123" } }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.id CONTAINS $param0
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

    test("startsWith", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id: { startsWith: "123" } }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.id STARTS WITH $param0
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

    test("endsWith", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id: { endsWith: "123" } }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.id ENDS WITH $param0
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

    test("lessThan", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { actorCount: { lt: 123 } }) {
                    actorCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.actorCount < $param0
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("lessThan BigInt", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { budget: { lt: 9223372036854775807 } }) {
                    budget
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.budget < $param0
            RETURN this { .budget } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": -1,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("lessThan String", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title: { lt: "The Matrix Revolutions" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title < $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix Revolutions\\"
            }"
        `);
    });

    test("lessThanEquals", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { actorCount: { lte: 123 } }) {
                    actorCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.actorCount <= $param0
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("lessThanEquals BigInt", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { budget: { lte: 9223372036854775807 } }) {
                    budget
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.budget <= $param0
            RETURN this { .budget } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": -1,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("lessThanEquals String", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title: { lte: "The Matrix Revolutions" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title <= $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix Revolutions\\"
            }"
        `);
    });

    test("greaterThan", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { actorCount: { gt: 123 } }) {
                    actorCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.actorCount > $param0
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("greaterThan BigInt", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { budget: { gt: 9223372036854775000 } }) {
                    budget
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.budget > $param0
            RETURN this { .budget } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": -808,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("greaterThan String", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title: { gt: "The Matrix Revolutions" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title > $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix Revolutions\\"
            }"
        `);
    });

    test("greaterThanEquals", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { actorCount: { gte: 123 } }) {
                    actorCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.actorCount >= $param0
            RETURN this { .actorCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("greaterThanEquals BigInt", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { budget: { gte: 9223372036854775000 } }) {
                    budget
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.budget >= $param0
            RETURN this { .budget } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": -808,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("greaterThanEquals String", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title: { gte: "The Matrix Revolutions" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title >= $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix Revolutions\\"
            }"
        `);
    });

    describe("Relationships", () => {
        test("equality", async () => {
            const query = /* GraphQL */ `
                {
                    movies(where: { genres: { some: { name: { eq: "some genre" } } } }) {
                        actorCount
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Movie)
                WHERE EXISTS {
                    MATCH (this)-[:IN_GENRE]->(this0:Genre)
                    WHERE this0.name = $param0
                }
                RETURN this { .actorCount } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"some genre\\"
                }"
            `);
        });

        describe("List Predicates", () => {
            const generateQuery = (operator: "all" | "none" | "single" | "some"): string => {
                const query = /* GraphQL */ `
                    {
                        movies(where: { genres: { ${operator}: { name: { eq: "some genre" } } } }) {
                            actorCount
                        }
                    }
                `;
                return query;
            };
            test("all", async () => {
                const query = generateQuery("all");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Movie)
                    WHERE (EXISTS {
                        MATCH (this)-[:IN_GENRE]->(this0:Genre)
                        WHERE this0.name = $param0
                    } AND NOT (EXISTS {
                        MATCH (this)-[:IN_GENRE]->(this0:Genre)
                        WHERE NOT (this0.name = $param0)
                    }))
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });

            test("none", async () => {
                const query = generateQuery("none");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Movie)
                    WHERE NOT (EXISTS {
                        MATCH (this)-[:IN_GENRE]->(this0:Genre)
                        WHERE this0.name = $param0
                    })
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });

            test("single", async () => {
                const query = generateQuery("single");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Movie)
                    WHERE single(this0 IN [(this)-[:IN_GENRE]->(this0:Genre) WHERE this0.name = $param0 | 1] WHERE true)
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });
            test("some", async () => {
                const query = generateQuery("some");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Movie)
                    WHERE EXISTS {
                        MATCH (this)-[:IN_GENRE]->(this0:Genre)
                        WHERE this0.name = $param0
                    }
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });
        });
    });

    describe("Connections", () => {
        test("Node and relationship properties equality", async () => {
            const query = /* GraphQL */ `
                {
                    movies(where: { genresConnection: { some: { node: { name: { eq: "some genre" } } } } }) {
                        actorCount
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Movie)
                WHERE EXISTS {
                    MATCH (this)-[this0:IN_GENRE]->(this1:Genre)
                    WHERE this1.name = $param0
                }
                RETURN this { .actorCount } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"some genre\\"
                }"
            `);
        });

        test("Node and relationship properties NONE", async () => {
            const query = /* GraphQL */ `
                {
                    movies(where: { genresConnection: { none: { node: { name: { eq: "some genre" } } } } }) {
                        actorCount
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:Movie)
                WHERE NOT (EXISTS {
                    MATCH (this)-[this0:IN_GENRE]->(this1:Genre)
                    WHERE this1.name = $param0
                })
                RETURN this { .actorCount } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"some genre\\"
                }"
            `);
        });

        describe("List Predicates", () => {
            const generateQuery = (operator: "all" | "none" | "single" | "some"): string => {
                const query = /* GraphQL */ `
                    {
                        movies(where: { genresConnection: { ${operator}: { node: { name: { eq: "some genre" }} } } }) {
                            actorCount
                        }
                    }
                `;
                return query;
            };
            test("all", async () => {
                const query = generateQuery("all");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Movie)
                    WHERE (EXISTS {
                        MATCH (this)-[this0:IN_GENRE]->(this1:Genre)
                        WHERE this1.name = $param0
                    } AND NOT (EXISTS {
                        MATCH (this)-[this0:IN_GENRE]->(this1:Genre)
                        WHERE NOT (this1.name = $param0)
                    }))
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });
            test("none", async () => {
                const query = generateQuery("none");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Movie)
                    WHERE NOT (EXISTS {
                        MATCH (this)-[this0:IN_GENRE]->(this1:Genre)
                        WHERE this1.name = $param0
                    })
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });
            test("single", async () => {
                const query = generateQuery("single");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Movie)
                    WHERE single(this0 IN [(this)-[this1:IN_GENRE]->(this0:Genre) WHERE this0.name = $param0 | 1] WHERE true)
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });
            test("some", async () => {
                const query = generateQuery("some");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "CYPHER 5
                    MATCH (this:Movie)
                    WHERE EXISTS {
                        MATCH (this)-[this0:IN_GENRE]->(this1:Genre)
                        WHERE this1.name = $param0
                    }
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });
        });
    });
});
