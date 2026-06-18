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

import neo4j from "neo4j-driver";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7315", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("Int @populatedBy callback value on CREATE is stored as a Neo4j integer, not a float", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const expected = 123456;

        const callback = () => Promise.resolve(expected);

        const typeDefs = /* GraphQL */ `
            type ${Movie.name} @node {
                id: ID
                callback: Int! @populatedBy(operations: [CREATE], callback: "callback")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        callback,
                    },
                },
            },
        });

        const movieId = "movie_id";

        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [{ id: "${movieId}" }]) {
                    ${Movie.plural} {
                        id
                        callback
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toMatchObject({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        id: movieId,
                        callback: expected,
                    },
                ],
            },
        });

        const dbResult = await testHelper.executeCypher(
            `MATCH (m:${Movie.name} { id: $id }) RETURN m.callback AS callback`,
            { id: movieId }
        );

        const storedValue = dbResult.records[0]?.get("callback");

        expect(neo4j.isInt(storedValue)).toBe(true);
        expect(neo4j.isInt(storedValue) && storedValue.toNumber()).toBe(expected);
    });
});
