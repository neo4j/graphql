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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher -> Connections -> Unions", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            union Publication = Book | Journal

            type Author {
                name: String!
                publications: [Publication] @relationship(type: "WROTE", direction: OUT, properties: "Wrote")
            }

            type Book {
                title: String!
                author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            type Journal {
                subject: String!
                author: [Author!]! @relationship(type: "WROTE", direction: IN, properties: "Wrote")
            }

            interface Wrote {
                words: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Projecting union node and relationship properties with no arguments", async () => {
        const query = gql`
            query {
                authors {
                    name
                    publicationsConnection {
                        edges {
                            words
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Book:Book)
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Book\\", title: this_Book.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Journal:Journal)
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Journal\\", subject: this_Journal.subject } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
            }
            RETURN this { .name, publicationsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Projecting union node and relationship properties with where argument", async () => {
        const query = gql`
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
                            words
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Book:Book)
            WHERE this_Book.title = $this_publicationsConnection.args.where.Book.node.title
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Book\\", title: this_Book.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Journal:Journal)
            WHERE this_Journal.subject = $this_publicationsConnection.args.where.Journal.node.subject
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Journal\\", subject: this_Journal.subject } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
            }
            RETURN this { .name, publicationsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_publicationsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"Book\\": {
                                \\"node\\": {
                                    \\"title\\": \\"Book Title\\"
                                }
                            },
                            \\"Journal\\": {
                                \\"node\\": {
                                    \\"subject\\": \\"Journal Subject\\"
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Projecting union node and relationship properties with where relationship argument", async () => {
        const query = gql`
            query {
                authors {
                    name
                    publicationsConnection(
                        where: { Book: { edge: { words: 1000 } }, Journal: { edge: { words: 2000 } } }
                    ) {
                        edges {
                            words
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Book:Book)
            WHERE this_wrote_relationship.words = $this_publicationsConnection.args.where.Book.edge.words
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Book\\", title: this_Book.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Journal:Journal)
            WHERE this_wrote_relationship.words = $this_publicationsConnection.args.where.Journal.edge.words
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Journal\\", subject: this_Journal.subject } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
            }
            RETURN this { .name, publicationsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_publicationsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"Book\\": {
                                \\"edge\\": {
                                    \\"words\\": {
                                        \\"low\\": 1000,
                                        \\"high\\": 0
                                    }
                                }
                            },
                            \\"Journal\\": {
                                \\"edge\\": {
                                    \\"words\\": {
                                        \\"low\\": 2000,
                                        \\"high\\": 0
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Projecting union node and relationship properties with where node and relationship argument", async () => {
        const query = gql`
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
                            words
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Book:Book)
            WHERE this_Book.title = $this_publicationsConnection.args.where.Book.node.title AND this_wrote_relationship.words = $this_publicationsConnection.args.where.Book.edge.words
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Book\\", title: this_Book.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Journal:Journal)
            WHERE this_Journal.subject = $this_publicationsConnection.args.where.Journal.node.subject AND this_wrote_relationship.words = $this_publicationsConnection.args.where.Journal.edge.words
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Journal\\", subject: this_Journal.subject } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
            }
            RETURN this { .name, publicationsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_publicationsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"Book\\": {
                                \\"node\\": {
                                    \\"title\\": \\"Book Title\\"
                                },
                                \\"edge\\": {
                                    \\"words\\": {
                                        \\"low\\": 1000,
                                        \\"high\\": 0
                                    }
                                }
                            },
                            \\"Journal\\": {
                                \\"node\\": {
                                    \\"subject\\": \\"Journal Subject\\"
                                },
                                \\"edge\\": {
                                    \\"words\\": {
                                        \\"low\\": 2000,
                                        \\"high\\": 0
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Projecting union node and relationship properties with sort argument", async () => {
        const query = gql`
            query {
                authors {
                    name
                    publicationsConnection(sort: [{ edge: { words: ASC } }]) {
                        edges {
                            words
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Author)
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Book:Book)
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Book\\", title: this_Book.title } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_wrote_relationship:WROTE]->(this_Journal:Journal)
            WITH { words: this_wrote_relationship.words, node: { __resolveType: \\"Journal\\", subject: this_Journal.subject } } AS edge
            RETURN edge
            }
            WITH edge ORDER BY edge.words ASC
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS publicationsConnection
            }
            RETURN this { .name, publicationsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
