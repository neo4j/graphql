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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2548", () => {
    const secret = "secret";
    const testHelper = new TestHelper();

    let User: UniqueType;

    let query: string;

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");

        const typeDefs = `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${User}
                @authorization(
                    filter: [
                        { operations: [READ], requireAuthentication: false, where: { node: { isPublic: true } } }
                        { operations: [READ], where: { jwt: { roles_INCLUDES: "ADMIN" } } }
                    ]
                ) {
                userId: ID! @id @unique
                isPublic: Boolean
            }
        `;

        query = `
            {
                ${User.plural} {
                    userId
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        await testHelper.executeCypher(`
            CREATE (:${User} { userId: "1", isPublic: true })
            CREATE (:${User} { userId: "2", isPublic: false })
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return public information for unauthenticated request", async () => {
        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [User.plural]: [
                {
                    userId: "1",
                },
            ],
        });
    });

    test("should return all records for admin request", async () => {
        const token = createBearerToken(secret, { roles: ["ADMIN"] });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeFalsy();
        expect((result.data as any)[User.plural]).toIncludeSameMembers([
            {
                userId: "1",
            },
            {
                userId: "2",
            },
        ]);
    });
});
