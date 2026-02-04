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

import { generate } from "randomstring";
import { TestHelper } from "../../../../utils/tests-helper";

describe("array-pop-and-push", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should push to and pop from two different arrays in the same update", async () => {
        const Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                tags: [String!]
                moreTags: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const movieTitle = generate({
            charset: "alphabetic",
        });

        const update = /* GraphQL */ `
            mutation {
                ${Movie.operations.update} (update: { tags: { push: "new tag" }, moreTags: { pop: 2 } }) {
                    ${Movie.plural} {
                        title
                        tags
                        moreTags
                    }
                }
            }
        `;

        const cypher = `CREATE (m:${Movie} {title:$movieTitle, tags: ["abc"], moreTags: ["this", "that", "them"] })`;

        await testHelper.executeCypher(cypher, { movieTitle });

        const gqlResult = await testHelper.executeGraphQL(update);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[Movie.operations.update][Movie.plural]).toEqual([
            { title: movieTitle, tags: ["abc", "new tag"], moreTags: ["this"] },
        ]);
    });
});
