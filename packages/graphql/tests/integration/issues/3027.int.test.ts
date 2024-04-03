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

describe("https://github.com/neo4j/graphql/issues/3027", () => {
    describe("union", () => {
        const testHelper = new TestHelper();

        let Book: UniqueType;
        let BookTitle_SV: UniqueType;
        let BookTitle_EN: UniqueType;

        beforeEach(async () => {
            Book = testHelper.createUniqueType("Book");
            BookTitle_SV = testHelper.createUniqueType("BookTitle_SV");
            BookTitle_EN = testHelper.createUniqueType("BookTitle_EN");

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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("should validate cardinality against all the implementations", async () => {
            await testHelper.executeCypher(`
           CREATE(:${Book} {isbn: "123", originalTitle: "Original title"})<-[:TRANSLATED_BOOK_TITLE]-(:${BookTitle_SV} { value: "Exempel på svensk titel"})
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

            const result = await testHelper.executeGraphQL(query);

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
        const testHelper = new TestHelper();

        let Book: UniqueType;
        let BookTitle_SV: UniqueType;
        let BookTitle_EN: UniqueType;

        beforeEach(async () => {
            Book = testHelper.createUniqueType("Book");
            BookTitle_SV = testHelper.createUniqueType("BookTitle_SV");
            BookTitle_EN = testHelper.createUniqueType("BookTitle_EN");

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

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });
        });

        afterEach(async () => {
            await testHelper.close();
        });

        test("should validate cardinality against all the implementations", async () => {
            await testHelper.executeCypher(`
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

            const result = await testHelper.executeGraphQL(query);

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
