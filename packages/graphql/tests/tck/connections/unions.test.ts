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

describe("Cypher -> Connections -> Unions", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            union Publication = Book | Journal

            type Author @node {
                name: String!
                publications: [Publication!]! @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
            }

            type Book @node {
                title: String!
                author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            type Journal @node {
                subject: String!
                author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            type Wrote @relationshipProperties {
                words: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Projecting union node and relationship properties with no arguments", async () => {
        const query = /* GraphQL */ `
            query {
                authors {
                    name
                    publicationsConnection {
                        edges {
                            properties {
                                words
                            }
                            node {
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:WROTE]->(this1:Book)
                    WITH { properties: { words: this0.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Book\\", __id: id(this1), title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:WROTE]->(this3:Journal)
                    WITH { properties: { words: this2.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Journal\\", __id: id(this3), subject: this3.subject } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { .name, publicationsConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Projecting union node and relationship properties with where argument", async () => {
        const query = /* GraphQL */ `
            query {
                authors {
                    name
                    publicationsConnection(
                        where: {
                            Book: { node: { title: "Book Title" } }
                            Journal: { node: { subject: "Journal Subject" } }
                        }
                    ) {
                        edges {
                            properties {
                                words
                            }
                            node {
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:WROTE]->(this1:Book)
                    WHERE this1.title = $param0
                    WITH { properties: { words: this0.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Book\\", __id: id(this1), title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:WROTE]->(this3:Journal)
                    WHERE this3.subject = $param1
                    WITH { properties: { words: this2.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Journal\\", __id: id(this3), subject: this3.subject } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { .name, publicationsConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Book Title\\",
                \\"param1\\": \\"Journal Subject\\"
            }"
        `);
    });

    test("Projecting union node and relationship properties with where relationship argument", async () => {
        const query = /* GraphQL */ `
            query {
                authors {
                    name
                    publicationsConnection(
                        where: { Book: { edge: { words: 1000 } }, Journal: { edge: { words: 2000 } } }
                    ) {
                        edges {
                            properties {
                                words
                            }
                            node {
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:WROTE]->(this1:Book)
                    WHERE this0.words = $param0
                    WITH { properties: { words: this0.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Book\\", __id: id(this1), title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:WROTE]->(this3:Journal)
                    WHERE this2.words = $param1
                    WITH { properties: { words: this2.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Journal\\", __id: id(this3), subject: this3.subject } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { .name, publicationsConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1000,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 2000,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Projecting union node and relationship properties with where node and relationship argument", async () => {
        const query = /* GraphQL */ `
            query {
                authors {
                    name
                    publicationsConnection(
                        where: {
                            Book: { edge: { words: 1000 }, node: { title: "Book Title" } }
                            Journal: { edge: { words: 2000 }, node: { subject: "Journal Subject" } }
                        }
                    ) {
                        edges {
                            properties {
                                words
                            }
                            node {
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:WROTE]->(this1:Book)
                    WHERE (this1.title = $param0 AND this0.words = $param1)
                    WITH { properties: { words: this0.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Book\\", __id: id(this1), title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:WROTE]->(this3:Journal)
                    WHERE (this3.subject = $param2 AND this2.words = $param3)
                    WITH { properties: { words: this2.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Journal\\", __id: id(this3), subject: this3.subject } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { .name, publicationsConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Book Title\\",
                \\"param1\\": {
                    \\"low\\": 1000,
                    \\"high\\": 0
                },
                \\"param2\\": \\"Journal Subject\\",
                \\"param3\\": {
                    \\"low\\": 2000,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Projecting union node and relationship properties with sort argument", async () => {
        const query = /* GraphQL */ `
            query {
                authors {
                    name
                    publicationsConnection(sort: [{ edge: { words: ASC } }]) {
                        edges {
                            properties {
                                words
                            }
                            node {
                                ... on Book {
                                    title
                                }
                                ... on Journal {
                                    subject
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:WROTE]->(this1:Book)
                    WITH { properties: { words: this0.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Book\\", __id: id(this1), title: this1.title } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:WROTE]->(this3:Journal)
                    WITH { properties: { words: this2.words, __resolveType: \\"Wrote\\" }, node: { __resolveType: \\"Journal\\", __id: id(this3), subject: this3.subject } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    ORDER BY edge.properties.words ASC
                    RETURN collect(edge) AS var4
                }
                RETURN { edges: var4, totalCount: totalCount } AS var5
            }
            RETURN this { .name, publicationsConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
