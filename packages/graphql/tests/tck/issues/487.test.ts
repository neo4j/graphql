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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/487", () => {
    test("related fields should resolve on custom queries (union)", async () => {
        const typeDefs = gql`
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
            WITH node AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:Book
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:WROTE]-(this2:Author)
                        WITH this2 { .id } AS this2
                        RETURN head(collect(this2)) AS var3
                    }
                    WITH this0 { .id, author: var3, __resolveType: \\"Book\\", __id: id(this0) } AS this0
                    RETURN this0 AS var4
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this5:DIRECTED]-(this6:Director)
                        WITH this6 { .id } AS this6
                        RETURN head(collect(this6)) AS var7
                    }
                    WITH this0 { .id, director: var7, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var4
                }
                RETURN var4
            }
            RETURN var4 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("related fields should resolve on custom queries (interface)", async () => {
        const typeDefs = gql`
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
        const query = gql`
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
            WITH node AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:Book
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:WROTE]-(this2:Author)
                        WITH this2 { .id } AS this2
                        RETURN head(collect(this2)) AS var3
                    }
                    WITH this0 { .id, author: var3, __resolveType: \\"Book\\", __id: id(this0) } AS this0
                    RETURN this0 AS var4
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this5:DIRECTED]-(this6:Director)
                        WITH this6 { .id } AS this6
                        RETURN head(collect(this6)) AS var7
                    }
                    WITH this0 { .id, director: var7, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var4
                }
                RETURN var4
            }
            RETURN var4 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});

describe("https://github.com/neo4j/graphql/issues/487, test on interface", () => {});
