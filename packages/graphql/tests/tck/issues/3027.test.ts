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

describe("https://github.com/neo4j/graphql/issues/3027", () => {
    describe("union", () => {
        let neoSchema: Neo4jGraphQL;

        const typeDefs = gql`
            type Book {
                originalTitle: String!
                translatedTitle: BookTitle @relationship(type: "TRANSLATED_BOOK_TITLE", direction: IN)
                isbn: String!
            }

            union BookTitle = BookTitle_SV | BookTitle_EN

            type BookTitle_SV {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }

            type BookTitle_EN {
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
            const query = gql`
                mutation UpdateBooks {
                    updateBooks(
                        where: { isbn: "123" }
                        create: { translatedTitle: { BookTitle_EN: { node: { value: "English book title" } } } }
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
                "MATCH (this:\`Book\`)
                WHERE this.isbn = $param0
                CALL apoc.util.validate(EXISTS((this)<-[:TRANSLATED_BOOK_TITLE]-(:BookTitle_SV)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"Book\\",\\"translatedTitle\\"])
                CALL apoc.util.validate(EXISTS((this)<-[:TRANSLATED_BOOK_TITLE]-(:BookTitle_EN)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"Book\\",\\"translatedTitle\\"])
                CREATE (this_create_translatedTitle_BookTitle_EN0_node:BookTitle_EN)
                SET this_create_translatedTitle_BookTitle_EN0_node.value = $this_create_translatedTitle_BookTitle_EN0_node_value
                MERGE (this)<-[:TRANSLATED_BOOK_TITLE]-(this_create_translatedTitle_BookTitle_EN0_node)
                WITH *
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)<-[update_this0:TRANSLATED_BOOK_TITLE]-(update_this1:\`BookTitle_SV\`)
                        WITH update_this1 { __resolveType: \\"BookTitle_SV\\", __id: id(this), .value } AS update_this1
                        RETURN update_this1 AS update_var2
                        UNION
                        WITH *
                        MATCH (this)<-[update_this3:TRANSLATED_BOOK_TITLE]-(update_this4:\`BookTitle_EN\`)
                        WITH update_this4 { __resolveType: \\"BookTitle_EN\\", __id: id(this), .value } AS update_this4
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
                                \\"this_create_translatedTitle_BookTitle_EN0_node_value\\": \\"English book title\\",
                                \\"resolvedCallbacks\\": {}
                            }"
                    `);
        });
    });

    describe("interface", () => {
        let neoSchema: Neo4jGraphQL;

        const typeDefs = gql`
            type Book {
                originalTitle: String!
                translatedTitle: BookTitle @relationship(type: "TRANSLATED_BOOK_TITLE", direction: IN)
                isbn: String!
            }

            interface BookTitle {
                value: String!
            }

            type BookTitle_SV implements BookTitle {
                book: Book! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
                value: String!
            }

            type BookTitle_EN implements BookTitle {
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
            const query = gql`
                mutation UpdateBooks {
                    updateBooks(
                        where: { isbn: "123" }
                        create: { translatedTitle: { node: { BookTitle_EN: { value: "English book title" } } } }
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
                "MATCH (this:\`Book\`)
                WHERE this.isbn = $param0
                CALL apoc.util.validate(EXISTS((this)<-[:TRANSLATED_BOOK_TITLE]-(:BookTitle_SV)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"Book\\",\\"translatedTitle\\"])
                CALL apoc.util.validate(EXISTS((this)<-[:TRANSLATED_BOOK_TITLE]-(:BookTitle_EN)),'Relationship field \\"%s.%s\\" cannot have more than one node linked',[\\"Book\\",\\"translatedTitle\\"])
                CREATE (this_create_translatedTitle_BookTitle_EN0_node_BookTitle_EN:BookTitle_EN)
                SET this_create_translatedTitle_BookTitle_EN0_node_BookTitle_EN.value = $this_create_translatedTitle_BookTitle_EN0_node_BookTitle_EN_value
                MERGE (this)<-[:TRANSLATED_BOOK_TITLE]-(this_create_translatedTitle_BookTitle_EN0_node_BookTitle_EN)
                WITH *
                CALL {
                    WITH this
                    CALL {
                        WITH *
                        MATCH (this)<-[update_this0:TRANSLATED_BOOK_TITLE]-(update_this1:\`BookTitle_SV\`)
                        WITH update_this1 { __resolveType: \\"BookTitle_SV\\", __id: id(this), .value } AS update_this1
                        RETURN update_this1 AS update_var2
                        UNION
                        WITH *
                        MATCH (this)<-[update_this3:TRANSLATED_BOOK_TITLE]-(update_this4:\`BookTitle_EN\`)
                        WITH update_this4 { __resolveType: \\"BookTitle_EN\\", __id: id(this) } AS update_this4
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
                    \\"this_create_translatedTitle_BookTitle_EN0_node_BookTitle_EN_value\\": \\"English book title\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
    });
});
