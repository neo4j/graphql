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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2581", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Author: UniqueType;
    let Book: UniqueType;
    let Sales: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Author = generateUniqueType("Author");
        Book = generateUniqueType("Book");
        Sales = generateUniqueType("Sales");

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
                refID: ID @id
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

        await session.run(`
        CREATE(a:${Author} {name: "Douglas Adams"})-[:AUTHORED_BOOK]->(:${Book} {name: "The Hitchhiker's Guide to the Galaxy", year:1979, refID:1})
        CREATE(a)-[:AUTHORED_BOOK]->(:${Book} {name: "The Restaurant at the End of the Universe", year:1980, refID:2})

        CREATE(:${Sales} {refID: 1})
        CREATE(:${Sales} {refID: 2})
        CREATE(:${Sales} {refID: 2})
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Book, Author, Sales]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
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

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

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
