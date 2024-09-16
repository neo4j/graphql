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
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/567", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        typeDefs = `
        type ${Movie} {
            id: ID!
            title: String!
        }
    `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not throw when only returning info on update", async () => {
        const movieId = generate({
            charset: "alphabetic",
        });

        const existingTitle = generate({
            charset: "alphabetic",
        });

        const newTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${Movie.operations.update}(where: { id: "${movieId}" }, update: { title: "${newTitle}" }) {
                    info {
                        nodesCreated
                        nodesDeleted
                    }
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (:${Movie} { id: "${movieId}", title: "${existingTitle}" })
            `);

        const result = await testHelper.executeGraphQL(query);

        if (result.errors) {
            console.log(JSON.stringify(result.errors, null, 2));
        }

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [Movie.operations.update]: {
                info: {
                    nodesCreated: 0,
                    nodesDeleted: 0,
                },
            },
        });
    });

    test("should not throw when only returning info on create", async () => {
        const movieId = generate({
            charset: "alphabetic",
        });

        const existingTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${Movie.operations.create}(input: [{ id: "${movieId}", title: "${existingTitle}" }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [Movie.operations.create]: {
                info: {
                    nodesCreated: 1,
                },
            },
        });
    });
});
