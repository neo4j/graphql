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

import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/3027", () => {
    describe("union", () => {
        let driver: Driver;
        let neo4j: Neo4jHelper;
        let neoSchema: Neo4jGraphQL;
        let session: Session;

        let Book: UniqueType;
        let BookTitle_SV: UniqueType;
        let BookTitle_EN: UniqueType;

        beforeAll(async () => {
            neo4j = new Neo4jHelper();
            driver = await neo4j.getDriver();
        });

        beforeEach(async () => {
            session = await neo4j.getSession();

            Book = new UniqueType("Book");
            BookTitle_SV = new UniqueType("BookTitle_SV");
            BookTitle_EN = new UniqueType("BookTitle_EN");

            const typeDefs = `
        type ${Book} {
            originalTitle: String!
            translatedTitle: BookTitle @relationship(type: "TRANSLATED_BOOK_TITLE", direction: IN)
            isbn: String!
        }
    
        union BookTitle = ${BookTitle_SV} | ${BookTitle_EN}
    
        type ${BookTitle_SV} {
            book: ${Book}! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
            value: String!
        }
    
        type ${BookTitle_EN} {
            book: ${Book}! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
            value: String!
        }
        `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
            });
        });

        afterEach(async () => {
            await cleanNodes(driver, [Book, BookTitle_EN, BookTitle_SV]);
            await session.close();
        });

        afterAll(async () => {
            await driver.close();
        });

        test("should validate cardinality against all the implementations", async () => {
            await session.run(`
           CREATE(book:${Book} {isbn: "123", originalTitle: "Original title"})<-[:TRANSLATED_BOOK_TITLE]-(:${BookTitle_SV} { value: "Exempel på svensk titel"})
        `);
            const query = `
        mutation UpdateBooks {
            ${Book.operations.update}(
              where: { isbn: "123" }
              create: { translatedTitle: { ${BookTitle_EN}: { node: { value: "English book title" } } } }
            ) {
              ${Book.plural} {
                isbn
                originalTitle
                translatedTitle {
                    ... on ${BookTitle_SV} {
                        value
                    }
                    ... on ${BookTitle_EN} {
                      value
                    }
                }
              }
            }
          }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeTruthy();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining(
                            `Relationship field "${Book.name}.translatedTitle" cannot have more than one node linked`
                        ),
                    }),
                ])
            );
            expect(result.data as any).toBeNull();
        });
    });

    describe("interface", () => {
        let driver: Driver;
        let neo4j: Neo4jHelper;
        let neoSchema: Neo4jGraphQL;
        let session: Session;

        let Book: UniqueType;
        let BookTitle_SV: UniqueType;
        let BookTitle_EN: UniqueType;

        beforeAll(async () => {
            neo4j = new Neo4jHelper();
            driver = await neo4j.getDriver();
        });

        beforeEach(async () => {
            session = await neo4j.getSession();

            Book = new UniqueType("Book");
            BookTitle_SV = new UniqueType("BookTitle_SV");
            BookTitle_EN = new UniqueType("BookTitle_EN");

            const typeDefs = `
        type ${Book} {
            originalTitle: String!
            translatedTitle: BookTitle @relationship(type: "TRANSLATED_BOOK_TITLE", direction: IN)
            isbn: String!
        }
    
        interface BookTitle {
            value: String!
        }
    
        type ${BookTitle_SV} implements BookTitle {
            book: ${Book}! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
            value: String!
        }
    
        type ${BookTitle_EN} implements BookTitle {
            book: ${Book}! @relationship(type: "TRANSLATED_BOOK_TITLE", direction: OUT)
            value: String!
        }
        `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
            });
        });

        afterEach(async () => {
            await cleanNodes(driver, [Book, BookTitle_EN, BookTitle_SV]);
            await session.close();
        });

        afterAll(async () => {
            await driver.close();
        });

        test("should validate cardinality against all the implementations", async () => {
            await session.run(`
           CREATE(book:${Book} {isbn: "123", originalTitle: "Original title"})<-[:TRANSLATED_BOOK_TITLE]-(:${BookTitle_SV} { value: "Exempel på svensk titel"})
        `);
            const query = `
        mutation UpdateBooks {
            ${Book.operations.update}(
              where: { isbn: "123" }
              create: { translatedTitle: { node: { ${BookTitle_EN}: { value: "English book title" } }
             } }
            ) {
              ${Book.plural} {
                isbn
                originalTitle
                translatedTitle {
                    ... on ${BookTitle_SV} {
                        value
                    }
                    ... on ${BookTitle_EN} {
                      value
                    }
                }
              }
            }
          }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeTruthy();
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        message: expect.stringContaining(
                            `Relationship field "${Book.name}.translatedTitle" cannot have more than one node linked`
                        ),
                    }),
                ])
            );
            expect(result.data as any).toBeNull();
        });
    });
});
