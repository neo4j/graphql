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

import type { Integer } from "neo4j-driver";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Upsert Batch Authentication", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;
    const secret = "secret";

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Actor} @authentication(operations: [UPDATE]) {
                name: String!
            }

            type ${Movie} @authentication(operations: [CREATE]) {
                title: String!
                released: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should fail a merge operation with CREATE authentication", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.upsert}(input: [{ node: { title: "The Matrix" } }]) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        const movieCountResult = await testHelper.executeCypher(`MATCH(m:${Movie}) RETURN COUNT(m) AS count`);
        const movieCount = movieCountResult.records[0]?.toObject().count as Integer;

        // expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");

        expect(movieCount.equals(0)).toBeTrue();
    });

    test("should accept a merge operation with CREATE authentication", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.upsert}(input: [{ node: { title: "The Matrix" } }]) {
                    ${Movie.plural} {
                        title
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret);
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        const movieCountResult = await testHelper.executeCypher(`MATCH(m:${Movie}) RETURN COUNT(m) AS count`);
        const movieCount = movieCountResult.records[0]?.toObject().count as Integer;

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.upsert]: {
                [Movie.plural]: [
                    {
                        title: "The Matrix",
                    },
                ],
            },
        });
        expect(movieCount.equals(1)).toBeTrue();
    });

    test("should fail a merge operation with UPDATE authentication", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Actor.operations.upsert}(input: [{ node: { name: "Keanu" } }]) {
                    ${Actor.plural} {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        const movieCountResult = await testHelper.executeCypher(`MATCH(m:${Actor}) RETURN COUNT(m) AS count`);
        const movieCount = movieCountResult.records[0]?.toObject().count as Integer;

        // expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.errors as any[])[0].message).toBe("Unauthenticated");

        expect(movieCount.equals(0)).toBeTrue();
    });

    test("should accept a merge operation with UPDATE authentication", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Actor.operations.upsert}(input: [{ node: { name: "Keanu" } }]) {
                    ${Actor.plural} {
                        name
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret);
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        const movieCountResult = await testHelper.executeCypher(`MATCH(m:${Actor}) RETURN COUNT(m) AS count`);
        const movieCount = movieCountResult.records[0]?.toObject().count as Integer;

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Actor.operations.upsert]: {
                [Actor.plural]: [
                    {
                        name: "Keanu",
                    },
                ],
            },
        });
        expect(movieCount.equals(1)).toBeTrue();
    });
});
