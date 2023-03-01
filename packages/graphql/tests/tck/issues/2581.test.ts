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

describe("https://github.com/neo4j/graphql/issues/2581", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = `
            type Author {
                name: String
                mostRecentBook: Book
                    @cypher(
                        statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b AS result ORDER BY b.year DESC LIMIT 1"
                        columnName: "result"
                    )
                mostRecentBooks: [Book!]
                    @cypher(
                        statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b AS result ORDER BY b.year DESC LIMIT 5"
                        columnName: "result"
                    )
                lastPublishedYear: Int
                    @cypher(
                        statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b.year AS result ORDER BY b.year DESC LIMIT 1"
                        columnName: "result"
                    )
                books: [Book!]! @relationship(type: "AUTHORED_BOOK", direction: OUT)
            }

            type Book {
                name: String!
                year: Int
                refID: ID @id
                soldCopies: Int
                    @cypher(
                        statement: "OPTIONAL MATCH(sales:Sales) WHERE this.refID = sales.refID WITH count(sales) as result RETURN result as result"
                        columnName: "result"
                    )
                soldCopiesWithoutColumnName: Int
                    @cypher(
                        statement: "OPTIONAL MATCH(sales:Sales) WHERE this.refID = sales.refID WITH count(sales) as result RETURN result as result"
                    )
                authors: [Author!]! @relationship(type: "AUTHORED_BOOK", direction: IN)
            }

            type Sales {
                price: Int
                refID: ID
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("query nested custom cypher with columnName", async () => {
        const query = gql`
            query {
                authors {
                    name
                    mostRecentBook {
                        name
                        year
                        soldCopies
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Author\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b AS result ORDER BY b.year DESC LIMIT 1
                }
                WITH result AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        OPTIONAL MATCH(sales:Sales) WHERE this.refID = sales.refID WITH count(sales) as result RETURN result as result
                    }
                    UNWIND result AS this1
                    RETURN head(collect(this1)) AS this1
                }
                RETURN head(collect(this0 { .name, .year, soldCopies: this1 })) AS this0
            }
            RETURN this { .name, mostRecentBook: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("query nested custom cypher without columnName", async () => {
        const query = gql`
            query {
                authors {
                    name
                    mostRecentBook {
                        name
                        year
                        soldCopiesWithoutColumnName
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Author\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:AUTHORED_BOOK]->(b:Book) RETURN b AS result ORDER BY b.year DESC LIMIT 1
                }
                WITH result AS this0
                CALL {
                    WITH this0
                    UNWIND apoc.cypher.runFirstColumnSingle(\\"OPTIONAL MATCH(sales:Sales) WHERE this.refID = sales.refID WITH count(sales) as result RETURN result as result\\", { this: this0, auth: $auth }) AS this1
                    RETURN head(collect(this1)) AS this1
                }
                RETURN head(collect(this0 { .name, .year, soldCopiesWithoutColumnName: this1 })) AS this0
            }
            RETURN this { .name, mostRecentBook: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});
