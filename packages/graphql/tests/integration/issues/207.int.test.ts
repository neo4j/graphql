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

describe("https://github.com/neo4j/graphql/issues/207", () => {
    let Book: UniqueType;
    let Author: UniqueType;
    let typeDefs: string;
    const testHelper = new TestHelper();

    beforeAll(() => {
        Book = testHelper.createUniqueType("Book");
        Author = testHelper.createUniqueType("Author");
        typeDefs = `
            union Result = ${Book} | ${Author}

            type ${Book} {
                title: String
            }

            type ${Author} {
                name: String
            }

            type Query {
                search: [Result]
            }
        `;
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("__resolveType resolvers are correctly evaluated", async () => {
        const resolvers = {
            Result: {
                __resolveType(obj) {
                    if (obj.name) {
                        return Author.toString();
                    }
                    if (obj.title) {
                        return Book.toString();
                    }
                    return null; // GraphQLError is thrown
                },
            },
            Query: {
                search: () => [{ title: "GraphQL Unions for Dummies" }, { name: "Darrell" }],
            },
        };

        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs, resolvers });

        const mutation = /* GraphQL */ `
            query GetSearchResults {
                search {
                    __typename
                    ... on ${Book} {
                        title
                    }
                    ... on ${Author} {
                        name
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeFalsy();

        expect(result?.data?.search).toEqual([
            {
                __typename: Book.name,
                title: "GraphQL Unions for Dummies",
            },
            {
                __typename: Author.name,
                name: "Darrell",
            },
        ]);
    });
});
