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
            type ${Author} {
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

            type ${Book} {
                name: String!
                year: Int
                refID: ID @id @unique
                soldCopies: Int
                    @cypher(
                        statement: "OPTIONAL MATCH(sales:${Sales}) WHERE this.refID = sales.refID WITH count(sales) as result RETURN result as result"
                        columnName: "result"
                    )
                authors: [${Author}!]! @relationship(type: "AUTHORED_BOOK", direction: IN)
            }

            type ${Sales} {
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
