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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/207", () => {
    let driver: Driver;
    const typeDefs = gql`
        union Result = Book | Author

        type Book {
            title: String
        }

        type Author {
            name: String
        }

        type Query {
            search: [Result]
        }
    `;
    const resolvers = {
        Result: {
            __resolveType(obj) {
                if (obj.name) {
                    return "Author";
                }
                if (obj.title) {
                    return "Book";
                }
                return null; // GraphQLError is thrown
            },
        },
        Query: {
            search: () => [{ title: "GraphQL Unions for Dummies" }, { name: "Darrell" }],
        },
    };

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("__resolveType resolvers are correctly evaluated", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers, driver });

        const mutation = `
            query GetSearchResults {
                search {
                    __typename
                    ... on Book {
                        title
                    }
                    ... on Author {
                        name
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.search).toEqual([
                {
                    __typename: "Book",
                    title: "GraphQL Unions for Dummies",
                },
                {
                    __typename: "Author",
                    name: "Darrell",
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
