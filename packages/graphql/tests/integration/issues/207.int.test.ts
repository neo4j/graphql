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
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/207", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Book: UniqueType;
    let Author: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Book = new UniqueType("Book");
        Author = new UniqueType("Author");
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
        await driver.close();
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

        const session = await neo4j.getSession();

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers, driver });

        const mutation = `
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

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValues(),
            });

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
        } finally {
            await session.close();
        }
    });
});
