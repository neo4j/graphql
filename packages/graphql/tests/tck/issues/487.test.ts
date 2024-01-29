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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/487", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Author {
                id: ID!
            }

            type Director {
                id: ID!
            }

            type Book {
                id: ID!
                author: Author! @relationship(type: "WROTE", direction: IN)
            }

            type Movie {
                id: ID!
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }

            union Thing = Book | Movie

            type Query {
                getThings: [Thing!]
                    @cypher(
                        statement: """
                        MATCH (node)
                        WHERE
                            "Book" IN labels(node) OR
                            "Movie" IN labels(node)
                        RETURN node
                        """
                        columnName: "node"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("related fields should resolve on custom queries", async () => {
        const query = gql`
            query {
                getThings {
                    __typename
                    ... on Book {
                        id
                        author {
                            id
                        }
                        __typename
                    }
                    ... on Movie {
                        id
                        director {
                            id
                        }
                        __typename
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            MATCH (node)
            WHERE
                \\"Book\\" IN labels(node) OR
                \\"Movie\\" IN labels(node)
            RETURN node
            }
            WITH node as this
            WHERE ($Book_labels0 IN labels(this)) OR ($Movie_labels0 IN labels(this))
            CALL {
                WITH this
                MATCH (this)<-[this0:WROTE]-(this1:Author)
                WITH this1 { .id } AS this1
                RETURN head(collect(this1)) AS var2
            }
            CALL {
                WITH this
                MATCH (this)<-[this3:DIRECTED]-(this4:Director)
                WITH this4 { .id } AS this4
                RETURN head(collect(this4)) AS var5
            }
            RETURN head( [ this IN [this] WHERE ($Book_labels0 IN labels(this))| this { __resolveType: \\"Book\\",  .id, author: var2 }] + [ this IN [this] WHERE ($Movie_labels0 IN labels(this))| this { __resolveType: \\"Movie\\",  .id, director: var5 }] ) AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"Book_labels0\\": \\"Book\\",
                \\"Movie_labels0\\": \\"Movie\\"
            }"
        `);
    });

    test.only("related fields should resolve on custom queries (Cypher Union Composite that I want)", async () => {
        const query = gql`
            query {
                getThings {
                    __typename
                    ... on Book {
                        id
                        author {
                            id
                        }
                        __typename
                    }
                    ... on Movie {
                        id
                        director {
                            id
                        }
                        __typename
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (node)
                WHERE
                    \\"Book\\" IN labels(node) OR
                    \\"Movie\\" IN labels(node)
                RETURN node
            }
            WITH node AS this
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)
                    WHERE this:Book
                    CALL {
                        WITH this
                        MATCH (this)<-[this0:WROTE]-(this1:Author)
                        WITH this1 { .id } AS this1
                        RETURN head(collect(this1)) AS var2
                    }
                    WITH this { .id, author: var2, __resolveType: \\"Book\\", __id: id(this) } AS this
                    RETURN this AS var3
                    UNION
                    WITH *
                    MATCH (this)
                    WHERE this:Movie
                    CALL {
                        WITH this
                        MATCH (this)<-[this4:DIRECTED]-(this5:Director)
                        WITH this5 { .id } AS this5
                        RETURN head(collect(this5)) AS var6
                    }
                    WITH this { .id, director: var6, __resolveType: \\"Movie\\", __id: id(this) } AS this
                    RETURN this AS var3
                }
                RETURN var3
            }
            RETURN var3 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("related fields should resolve on custom queries (compared)", async () => {
        const query = gql`
            query {
                getThings {
                    __typename
                    ... on Book {
                        id
                        author {
                            id
                        }
                        __typename
                    }
                    ... on Movie {
                        id
                        director {
                            id
                        }
                        __typename
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (node)
                WHERE
                    \\"Book\\" IN labels(node) OR
                    \\"Movie\\" IN labels(node)
                RETURN node
            }
            WITH node AS this
            CALL {
                WITH *
                MATCH (this0:Book)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:WROTE]-(this2:Author)
                    WITH this2 { .id } AS this2
                    RETURN head(collect(this2)) AS var3
                }
                WITH this0 { .id, author: var3, __resolveType: \\"Book\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                WITH *
                MATCH (this4:Movie)
                CALL {
                    WITH this4
                    MATCH (this4)<-[this5:DIRECTED]-(this6:Director)
                    WITH this6 { .id } AS this6
                    RETURN head(collect(this6)) AS var7
                }
                WITH this4 { .id, director: var7, __resolveType: \\"Movie\\", __id: id(this4) } AS this4
                RETURN this4 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
