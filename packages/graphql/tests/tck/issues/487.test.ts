/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/487", () => {
    test("related fields should resolve on custom queries (union)", async () => {
        const typeDefs = /* GraphQL */ `
            type Author @node {
                id: ID!
            }

            type Director @node {
                id: ID!
            }

            type Book @node {
                id: ID!
                author: [Author!]! @relationship(type: "WROTE", direction: IN)
            }

            type Movie @node {
                id: ID!
                director: [Director!]! @relationship(type: "DIRECTED", direction: IN)
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
            "CYPHER 5
            CALL {
              MATCH (node)
              WHERE
                  \\"Book\\" IN labels(node) OR
                  \\"Movie\\" IN labels(node)
              RETURN node
            }
            WITH node AS this0
            CALL (this0) {
              CALL (*) {
                WITH *
                MATCH (this0)
                WHERE this0:Book
                CALL (this0) {
                  MATCH (this0)<-[this1:WROTE]-(this2:Author)
                  WITH DISTINCT this2
                  WITH this2 { .id } AS this2
                  RETURN collect(this2) AS var3
                }
                WITH this0 { .id, author: var3, __resolveType: 'Book', __id: elementId(this0) } AS var4
                RETURN var4
                UNION
                WITH *
                MATCH (this0)
                WHERE this0:Movie
                CALL (this0) {
                  MATCH (this0)<-[this5:DIRECTED]-(this6:Director)
                  WITH DISTINCT this6
                  WITH this6 { .id } AS this6
                  RETURN collect(this6) AS var7
                }
                WITH this0 { .id, director: var7, __resolveType: 'Movie', __id: elementId(this0) } AS var4
                RETURN var4
              }
              RETURN var4
            }
            RETURN var4 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("related fields should resolve on custom queries (interface)", async () => {
        const typeDefs = /* GraphQL */ `
            type Author @node {
                id: ID!
            }

            type Director @node {
                id: ID!
            }

            type Book implements Thing @node {
                id: ID!
                author: [Author!]! @relationship(type: "WROTE", direction: IN)
            }

            type Movie implements Thing @node {
                id: ID!
                director: [Director!]! @relationship(type: "DIRECTED", direction: IN)
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
            "CYPHER 5
            CALL {
              MATCH (node)
              WHERE
                  \\"Book\\" IN labels(node) OR
                  \\"Movie\\" IN labels(node)
              RETURN node
            }
            WITH node AS this0
            CALL (this0) {
              CALL (*) {
                WITH *
                MATCH (this0)
                WHERE this0:Book
                CALL (this0) {
                  MATCH (this0)<-[this1:WROTE]-(this2:Author)
                  WITH DISTINCT this2
                  WITH this2 { .id } AS this2
                  RETURN collect(this2) AS var3
                }
                WITH this0 { .id, author: var3, __resolveType: 'Book', __id: elementId(this0) } AS var4
                RETURN var4
                UNION
                WITH *
                MATCH (this0)
                WHERE this0:Movie
                CALL (this0) {
                  MATCH (this0)<-[this5:DIRECTED]-(this6:Director)
                  WITH DISTINCT this6
                  WITH this6 { .id } AS this6
                  RETURN collect(this6) AS var7
                }
                WITH this0 { .id, director: var7, __resolveType: 'Movie', __id: elementId(this0) } AS var4
                RETURN var4
              }
              RETURN var4
            }
            RETURN var4 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});

describe("https://github.com/neo4j/graphql/issues/487, test on interface", () => {});
