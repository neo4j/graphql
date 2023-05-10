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

import type { Driver } from "neo4j-driver";
import type { DocumentNode } from "graphql";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/464", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    let typeAuthor: UniqueType;
    let typeBook: UniqueType;

    let typeDefs: DocumentNode;

    let neoSchema: Neo4jGraphQL;

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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(() => {
        typeAuthor = new UniqueType("Author");
        typeBook = new UniqueType("Book");

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

        neoSchema = new Neo4jGraphQL({ typeDefs });

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

    afterAll(async () => {
        await driver.close();
    });

    test("should run the mutation when passing a driver into the execution context", async () => {
        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: createMutation,
            contextValue: {
                ...neo4j.getContextValues(),
                driver: null,
                executionContext: driver,
            },
            variableValues: {
                id: bookId,
                name: bookName,
                authorId,
                authorName,
            },
        });

        if (result.errors) {
            console.log(JSON.stringify(result.errors, null, 2));
        }

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
            contextValue: {
                ...neo4j.getContextValues(),
                driver: null,
                executionContext: driver,
            },
        });

        expect(books.data?.[typeBook.plural]).toEqual([{ id: bookId, name: bookName }]);
    });

    test("should run the mutation and commit the result, but not close the session", async () => {
        const session = await neo4j.getSession();
        try {
            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutation,
                contextValue: { ...neo4j.getContextValues(), executionContext: session },
                variableValues: {
                    id: bookId,
                    name: bookName,
                    authorId,
                    authorName,
                },
            });

            if (result.errors) {
                console.log(JSON.stringify(result.errors, null, 2));
            }

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
                contextValue: { ...neo4j.getContextValues(), executionContext: session },
            });

            expect(books.data?.[typeBook.plural]).toEqual([{ id: bookId, name: bookName }]);
        } finally {
            await session.close();
        }
    });

    test("should run the mutation but not commit until it is done explicitly", async () => {
        const session = await neo4j.getSession();
        const transaction = session.beginTransaction();
        try {
            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: createMutation,
                contextValue: { ...neo4j.getContextValues(), executionContext: transaction },
                variableValues: {
                    id: bookId,
                    name: bookName,
                    authorId,
                    authorName,
                },
            });

            if (result.errors) {
                console.log(JSON.stringify(result.errors, null, 2));
            }

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
                contextValue: neo4j.getContextValues(),
            });

            expect(noBooks.data?.[typeBook.plural]).toEqual([]);

            await transaction.commit();

            const books = await graphql({
                schema: await neoSchema.getSchema(),
                source: queryBooks,
                contextValue: neo4j.getContextValues(),
            });

            expect(books.data?.[typeBook.plural]).toEqual([{ id: bookId, name: bookName }]);
        } finally {
            await session.close();
        }
    });
});
