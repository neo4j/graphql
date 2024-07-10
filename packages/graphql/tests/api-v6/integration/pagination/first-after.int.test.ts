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

import { offsetToCursor } from "graphql-relay";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Pagination with first and after", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix 1"})
            CREATE (:${Movie} {title: "The Matrix 2"})
            CREATE (:${Movie} {title: "The Matrix 3"})
            CREATE (:${Movie} {title: "The Matrix 4"})
            CREATE (:${Movie} {title: "The Matrix 5"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Get movies with first and after argument", async () => {
        const afterCursor = offsetToCursor(4);
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection(first: 1, after: "${afterCursor}", sort: { node: { title: ASC } }) {
                        edges {
                            node {
                                title
                            }
                        }
                        pageInfo {
                            hasPreviousPage
                            hasNextPage
                            startCursor
                            endCursor
                        }
                        
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                title: "The Matrix 5",
                            },
                        },
                    ],
                    pageInfo: {
                        endCursor: offsetToCursor(5),
                        hasNextPage: false,
                        hasPreviousPage: true,
                        startCursor: offsetToCursor(5),
                    },
                },
            },
        });
    });

    test.todo("Get movies and nested actors with first and after");
});
