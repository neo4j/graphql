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

describe("https://github.com/neo4j/graphql/issues/3027", () => {
    describe("union", () => {
        let neoSchema: Neo4jGraphQL;

        const typeDefs = /* GraphQL */ `
            type Book @node {
                originalTitle: String!
                translatedTitle: BookTitle @relationship(type: "TRANSLATED_BOOK_TITLE", direction: IN)
                isbn: String!
            }

            union BookTitle = BookTitle_SV | BookTitle_EN

            type BookTitle_SV @node {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }

            type BookTitle_EN @node {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }
        `;

        beforeAll(() => {
            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
        });

        test("should validate cardinality against all the implementations", async () => {
            const query = /* GraphQL */ `
                mutation UpdateBooks {
                    updateBooks(
                        where: { isbn_EQ: "123" }
                        update: {
                            translatedTitle: { BookTitle_EN: { create: { node: { value: "English book title" } } } }
                        }
                    ) {
                        info {
                            nodesCreated
                            nodesDeleted
                            relationshipsCreated
                            relationshipsDeleted
                        }
                        books {
                            isbn
                            originalTitle
                            translatedTitle {
                                ... on BookTitle_SV {
                                    value
                                }
                                ... on BookTitle_EN {
                                    value
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Book)
                WHERE this.isbn = $param0
                WITH this
                WITH *
                WHERE apoc.util.validatePredicate(EXISTS((this)<-[:TRANSLATED_BOOK_TITLE]-(:BookTitle_SV)) OR EXISTS((this)<-[:TRANSLATED_BOOK_TITLE]-(:BookTitle_EN)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"Book\\",\\"translatedTitle\\"])
                CREATE (this_translatedTitle_BookTitle_EN0_create0_node:BookTitle_EN)
                SET this_translatedTitle_BookTitle_EN0_create0_node.value = $this_translatedTitle_BookTitle_EN0_create0_node_value
                MERGE (this)<-[:TRANSLATED_BOOK_TITLE]-(this_translatedTitle_BookTitle_EN0_create0_node)
                WITH this, this_translatedTitle_BookTitle_EN0_create0_node
                CALL {
                	WITH this_translatedTitle_BookTitle_EN0_create0_node
                	MATCH (this_translatedTitle_BookTitle_EN0_create0_node)-[this_translatedTitle_BookTitle_EN0_create0_node_book_Book_unique:TRANSLATED_BOOK_TITLE]->(:Book)
                	WITH count(this_translatedTitle_BookTitle_EN0_create0_node_book_Book_unique) as c
                	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDBookTitle_EN.book required exactly once', [0])
                	RETURN c AS this_translatedTitle_BookTitle_EN0_create0_node_book_Book_unique_ignored
                }
                WITH *
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)<-[update_this0:TRANSLATED_BOOK_TITLE]-(update_this1:BookTitle_SV)
                        WITH update_this1 { .value, __resolveType: \\"BookTitle_SV\\", __id: id(update_this1) } AS update_this1
                        RETURN update_this1 AS update_var2
                        UNION
                        WITH *
                        MATCH (this)<-[update_this3:TRANSLATED_BOOK_TITLE]-(update_this4:BookTitle_EN)
                        WITH update_this4 { .value, __resolveType: \\"BookTitle_EN\\", __id: id(update_this4) } AS update_this4
                        RETURN update_this4 AS update_var2
                    }
                    WITH update_var2
                    RETURN head(collect(update_var2)) AS update_var2
                }
                RETURN collect(DISTINCT this { .isbn, .originalTitle, translatedTitle: update_var2 }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"123\\",
                    \\"this_translatedTitle_BookTitle_EN0_create0_node_value\\": \\"English book title\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
    });

    describe("interface", () => {
        let neoSchema: Neo4jGraphQL;

        const typeDefs = /* GraphQL */ `
            type Book @node {
                originalTitle: String!
                translatedTitle: BookTitle @relationship(type: "TRANSLATED_BOOK_TITLE", direction: IN)
                isbn: String!
            }

            interface BookTitle {
                value: String!
            }

            type BookTitle_SV implements BookTitle @node {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }

            type BookTitle_EN implements BookTitle @node {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }
        `;

        beforeAll(() => {
            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
        });

        test("should validate cardinality against all the implementations", async () => {
            const query = /* GraphQL */ `
                mutation UpdateBooks {
                    updateBooks(
                        where: { isbn_EQ: "123" }
                        update: {
                            translatedTitle: { create: { node: { BookTitle_EN: { value: "English book title" } } } }
                        }
                    ) {
                        books {
                            isbn
                            originalTitle
                            translatedTitle {
                                ... on BookTitle_SV {
                                    value
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Book)
                WHERE this.isbn = $param0
                WITH this
                CALL {
                	 WITH this
                WITH this
                RETURN count(*) AS update_this_BookTitle_SV
                }
                CALL {
                	 WITH this
                	WITH this
                WITH *
                WHERE apoc.util.validatePredicate(EXISTS((this)<-[:TRANSLATED_BOOK_TITLE]-(:BookTitle_SV)) OR EXISTS((this)<-[:TRANSLATED_BOOK_TITLE]-(:BookTitle_EN)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"Book\\",\\"translatedTitle\\"])
                CREATE (this_translatedTitle0_create0_node:BookTitle_EN)
                SET this_translatedTitle0_create0_node.value = $this_translatedTitle0_create0_node_value
                MERGE (this)<-[:TRANSLATED_BOOK_TITLE]-(this_translatedTitle0_create0_node)
                WITH this, this_translatedTitle0_create0_node
                CALL {
                	WITH this_translatedTitle0_create0_node
                	MATCH (this_translatedTitle0_create0_node)-[this_translatedTitle0_create0_node_book_Book_unique:TRANSLATED_BOOK_TITLE]->(:Book)
                	WITH count(this_translatedTitle0_create0_node_book_Book_unique) as c
                	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDBookTitle_EN.book required exactly once', [0])
                	RETURN c AS this_translatedTitle0_create0_node_book_Book_unique_ignored
                }
                RETURN count(*) AS update_this_BookTitle_EN
                }
                WITH *
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)<-[update_this0:TRANSLATED_BOOK_TITLE]-(update_this1:BookTitle_SV)
                        WITH update_this1 { .value, __resolveType: \\"BookTitle_SV\\", __id: id(update_this1) } AS update_this1
                        RETURN update_this1 AS update_var2
                        UNION
                        WITH *
                        MATCH (this)<-[update_this3:TRANSLATED_BOOK_TITLE]-(update_this4:BookTitle_EN)
                        WITH update_this4 { __resolveType: \\"BookTitle_EN\\", __id: id(update_this4) } AS update_this4
                        RETURN update_this4 AS update_var2
                    }
                    WITH update_var2
                    RETURN head(collect(update_var2)) AS update_var2
                }
                RETURN collect(DISTINCT this { .isbn, .originalTitle, translatedTitle: update_var2 }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"123\\",
                    \\"this_translatedTitle0_create0_node_value\\": \\"English book title\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
    });
});
