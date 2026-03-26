/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2581", () => {
    const testHelper = new TestHelper();

    let Author: UniqueType;
    let Book: UniqueType;
    let Sales: UniqueType;

    beforeEach(async () => {
        Author = testHelper.createUniqueType("Author");
        Book = testHelper.createUniqueType("Book");
        Sales = testHelper.createUniqueType("Sales");

        const typeDefs = `
            type ${Author} @node {
                name: String
                mostRecentBook: ${Book}
                    @cypher(
                        statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:${Book}) RETURN b AS result ORDER BY b.year DESC LIMIT 1"
                        columnName: "result"
                    )
                mostRecentBooks: [${Book}!]
                    @cypher(
                        statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:${Book}) RETURN b AS result ORDER BY b.year DESC LIMIT 5"
                        columnName: "result"
                    )
                lastPublishedYear: Int
                    @cypher(
                    statement: "MATCH (this)-[:AUTHORED_BOOK]->(b:${Book}) RETURN b.year AS result ORDER BY b.year DESC LIMIT 1"
                        columnName: "result"
                    )
                books: [${Book}!]! @relationship(type: "AUTHORED_BOOK", direction: OUT)
            }

            type ${Book} @node {
                name: String!
                year: Int
                refID: ID @id
                soldCopies: Int
                    @cypher(
                        statement: "OPTIONAL MATCH(sales:${Sales}) WHERE this.refID = sales.refID WITH count(sales) as result RETURN result as result"
                        columnName: "result"
                    )
                authors: [${Author}!]! @relationship(type: "AUTHORED_BOOK", direction: IN)
            }

            type ${Sales} @node {
                price: Int
                refID: ID
            }
        `;

        await testHelper.executeCypher(`
        CREATE(a:${Author} {name: "Douglas Adams"})-[:AUTHORED_BOOK]->(:${Book} {name: "The Hitchhiker's Guide to the Galaxy", year:1979, refID:1})
        CREATE(a)-[:AUTHORED_BOOK]->(:${Book} {name: "The Restaurant at the End of the Universe", year:1980, refID:2})

        CREATE(:${Sales} {refID: 1})
        CREATE(:${Sales} {refID: 2})
        CREATE(:${Sales} {refID: 2})
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should query custom cypher in nested query", async () => {
        const query = `
            query {
                ${Author.plural} {
                    name
                    mostRecentBook {
                        name
                        year
                        soldCopies
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [Author.plural]: [
                {
                    name: "Douglas Adams",
                    mostRecentBook: {
                        name: "The Restaurant at the End of the Universe",
                        year: 1980,
                        soldCopies: 2,
                    },
                },
            ],
        });
    });
});
