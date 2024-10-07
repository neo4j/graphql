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

    test("implicit EQ", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title_EQ: "The Matrix" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("EQ", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title_EQ: "The Matrix" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("IN", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { _id_IN: ["123"] }) {
                    _id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("REGEX", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id_MATCHES: "(?i)123.*" }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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
                movies(where: { NOT: { id_EQ: "123" } }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE NOT (this.id = $param0)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });


    test("CONTAINS", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id_CONTAINS: "123" }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id CONTAINS $param0
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

    
    test("STARTS_WITH", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id_STARTS_WITH: "123" }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id STARTS WITH $param0
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

 
    test("ENDS_WITH", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { id_ENDS_WITH: "123" }) {
                    id
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id ENDS WITH $param0
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
            }"
        `);
    });

   

    test("LT", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { actorCount_LT: 123 }) {
                    actorCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("LT BigInt", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { budget_LT: 9223372036854775807 }) {
                    budget
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("LT String", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title_LT: "The Matrix Revolutions" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title < $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix Revolutions\\"
            }"
        `);
    });

    test("LTE", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { actorCount_LTE: 123 }) {
                    actorCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("LTE BigInt", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { budget_LTE: 9223372036854775807 }) {
                    budget
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("LTE String", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title_LTE: "The Matrix Revolutions" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title <= $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix Revolutions\\"
            }"
        `);
    });

    test("GT", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { actorCount_GT: 123 }) {
                    actorCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("GT BigInt", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { budget_GT: 9223372036854775000 }) {
                    budget
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("GT String", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title_GT: "The Matrix Revolutions" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title > $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix Revolutions\\"
            }"
        `);
    });

    test("GTE", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { actorCount_GTE: 123 }) {
                    actorCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("GTE BigInt", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { budget_GTE: 9223372036854775000 }) {
                    budget
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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

    test("GTE String", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title_GTE: "The Matrix Revolutions" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
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
                    movies(where: { genres: { name_EQ: "some genre" } }) {
                        actorCount
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
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

        test("NONE", async () => {
            const query = /* GraphQL */ `
                {
                    movies(where: { genres_NONE: { name_EQ: "some genre" } }) {
                        actorCount
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
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

        describe("List Predicates", () => {
            const generateQuery = (operator: "ALL" | "NONE" | "SINGLE" | "SOME"): string => {
                const query = /* GraphQL */ `
                    {
                        movies(where: { genres_${operator}: { name_EQ: "some genre" } }) {
                            actorCount
                        }
                    }
                `;
                return query;
            };
            test("ALL", async () => {
                const query = generateQuery("ALL");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Movie)
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
            test("NONE", async () => {
                const query = generateQuery("NONE");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Movie)
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
            test("SINGLE", async () => {
                const query = generateQuery("SINGLE");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Movie)
                    WHERE single(this0 IN [(this)-[:IN_GENRE]->(this0:Genre) WHERE this0.name = $param0 | 1] WHERE true)
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });
            test("SOME", async () => {
                const query = generateQuery("SOME");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Movie)
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
                    movies(where: { genresConnection: { node: { name_EQ: "some genre" } } }) {
                        actorCount
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
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
                    movies(where: { genresConnection_NONE: { node: { name_EQ: "some genre" } } }) {
                        actorCount
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
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
            const generateQuery = (operator: "ALL" | "NONE" | "SINGLE" | "SOME"): string => {
                const query = /* GraphQL */ `
                    {
                        movies(where: { genresConnection_${operator}: { node: { name_EQ: "some genre" } } }) {
                            actorCount
                        }
                    }
                `;
                return query;
            };
            test("ALL", async () => {
                const query = generateQuery("ALL");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Movie)
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
            test("NONE", async () => {
                const query = generateQuery("NONE");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Movie)
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
            test("SINGLE", async () => {
                const query = generateQuery("SINGLE");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Movie)
                    WHERE single(this0 IN [(this)-[this1:IN_GENRE]->(this0:Genre) WHERE this0.name = $param0 | 1] WHERE true)
                    RETURN this { .actorCount } AS this"
                `);
                expect(formatParams(result.params)).toMatchInlineSnapshot(`
                    "{
                        \\"param0\\": \\"some genre\\"
                    }"
                `);
            });
            test("SOME", async () => {
                const query = generateQuery("SOME");

                const result = await translateQuery(neoSchema, query);

                expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                    "MATCH (this:Movie)
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
