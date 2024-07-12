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

import type { DocumentNode } from "graphql";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import type { Neo4jGraphQL } from "../../../src/classes";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/464", () => {
    let typeAuthor: UniqueType;
    let typeBook: UniqueType;

    let typeDefs: DocumentNode;

    let neoSchema: Neo4jGraphQL;

    const testHelper = new TestHelper();

    const bookId = generate({
        charset: "alphabetic",
    });

    const bookName = generate({
        readable: true,
        charset: "alphabetic",
    });

    const authorId = generate({
        charset: "alphabetic",
    });

    const authorName = generate({
        readable: true,
        charset: "alphabetic",
    });

    let createMutation: string;

    let queryBooks: string;

    beforeEach(async () => {
        typeAuthor = testHelper.createUniqueType("Author");
        typeBook = testHelper.createUniqueType("Book");

        typeDefs = gql`
            type ${typeAuthor.name} {
                id: ID!
                name: String!
            }

            type ${typeBook.name} {
                id: ID!
                name: String!
                author: ${typeAuthor.name}! @relationship(type: "WROTE", direction: IN)
            }
        `;

        neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        createMutation = `
            mutation CreateBooks($name: String!, $id: ID!, $authorName: String!, $authorId: ID!){
                ${typeBook.operations.create} (
                    input: [
                        {
                            id: $id
                            name: $name
                            author: {
                                create: {
                                    node: {
                                        id: $authorId
                                        name: $authorName
                                    }
                                }
                            }
                        }
                    ]
                ) {
                    info {
                        bookmark
                    }
                    ${typeBook.plural} {
                        id
                        name
                    }
                }
            }
        `;

        queryBooks = `
            query {
                ${typeBook.plural} {
                    id
                    name
                }
            }
        `;
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should run the mutation when passing a driver into the execution context", async () => {
        const driver = await testHelper.getDriver();
        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: createMutation,
            contextValue: await testHelper.getContextValue({ driver: null, executionContext: driver }),
            variableValues: {
                id: bookId,
                name: bookName,
                authorId,
                authorName,
            },
        });

        expect(result.errors).toBeFalsy();

        expect(result.data).toEqual({
            [typeBook.operations.create]: {
                info: { bookmark: expect.any(String) },
                [typeBook.plural]: [
                    {
                        id: bookId,
                        name: bookName,
                    },
                ],
            },
        });

        const books = await graphql({
            schema: await neoSchema.getSchema(),
            source: queryBooks,
            contextValue: await testHelper.getContextValue({ driver: null, executionContext: driver }),
        });

        expect(books.data?.[typeBook.plural]).toEqual([{ id: bookId, name: bookName }]);
    });

    test("should run the mutation and commit the result, but not close the session", async () => {
        const session = await testHelper.getSession();
        try {
            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutation,
                contextValue: testHelper.getContextValue({ executionContext: session }),
                variableValues: {
                    id: bookId,
                    name: bookName,
                    authorId,
                    authorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result.data).toEqual({
                [typeBook.operations.create]: {
                    info: { bookmark: expect.any(String) },
                    [typeBook.plural]: [
                        {
                            id: bookId,
                            name: bookName,
                        },
                    ],
                },
            });

            const books = await graphql({
                schema: await neoSchema.getSchema(),
                source: queryBooks,
                contextValue: testHelper.getContextValue({ executionContext: session }),
            });

            expect(books.data?.[typeBook.plural]).toEqual([{ id: bookId, name: bookName }]);
        } finally {
            await session.close();
        }
    });

    test("should run the mutation but not commit until it is done explicitly", async () => {
        const session = await testHelper.getSession();
        const transaction = await session.beginTransaction();
        try {
            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutation,
                contextValue: await testHelper.getContextValue({ executionContext: transaction }),
                variableValues: {
                    id: bookId,
                    name: bookName,
                    authorId,
                    authorName,
                },
            });

            expect(result.errors).toBeFalsy();

            expect(result.data).toEqual({
                [typeBook.operations.create]: {
                    info: { bookmark: null },
                    [typeBook.plural]: [
                        {
                            id: bookId,
                            name: bookName,
                        },
                    ],
                },
            });

            expect(transaction.isOpen()).toBe(true);

            const noBooks = await graphql({
                schema: await neoSchema.getSchema(),
                source: queryBooks,
                contextValue: await testHelper.getContextValue(),
            });

            expect(noBooks.data?.[typeBook.plural]).toEqual([]);

            await transaction.commit();

            const books = await graphql({
                schema: await neoSchema.getSchema(),
                source: queryBooks,
                contextValue: await testHelper.getContextValue({ executionContext: session }),
            });

            expect(books.data?.[typeBook.plural]).toEqual([{ id: bookId, name: bookName }]);
        } finally {
            await session.close();
        }
    });
});
