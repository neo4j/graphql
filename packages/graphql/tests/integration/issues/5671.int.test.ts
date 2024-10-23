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

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5671", () => {
    let Movie: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                tags: [String!]!
                rating: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should fail to update an array in the same update", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(update: { tags_POP: 1, tags_PUSH: "d" }) {
                    ${Movie.plural} {
                        title
                        tags
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toEqual([
            new GraphQLError(`Conflicting modification of [[tags_POP]], [[tags_PUSH]] on type ${Movie}`),
        ]);
    });

    test("should fail to update an int in the same update", async () => {
        const mutation = /* GraphQL */ `
            mutation UpdateMovies {
                ${Movie.operations.update}(update: { rating_INCREMENT: 5, rating_DECREMENT: 2 }) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toEqual([
            new GraphQLError(`Conflicting modification of [[rating_INCREMENT]], [[rating_DECREMENT]] on type ${Movie}`),
        ]);
    });
});
