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
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/487", () => {
    test("related fields should resolve on custom queries (union)", async () => {
        const typeDefs = /* GraphQL */ `
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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
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

    test("related fields should resolve on custom queries (interface)", async () => {
        const typeDefs = /* GraphQL */ `
            type Author {
                id: ID!
            }

            type Director {
                id: ID!
            }

            type Book implements Thing {
                id: ID!
                author: Author! @relationship(type: "WROTE", direction: IN)
            }

            type Movie implements Thing {
                id: ID!
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }

            interface Thing {
                id: ID!
            }

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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query {
                getThings {
                    __typename
                    id
                    ... on Book {
                        author {
                            id
                        }
                        __typename
                    }
                    ... on Movie {
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
});

describe("https://github.com/neo4j/graphql/issues/487, test on interface", () => {});
