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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("case insensitive filters in authorization", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("validate case insensitive jwt in read operation", async () => {
        const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    id: String
                }

                extend type ${User} @authorization(filter: [{ operations: [READ], where: { node: { id: {caseInsensitive: { eq: "$jwt.sub" } } } } }])
            `;

        const userId = "MyUserId";

        const query = /* GraphQL */ `
                {
                    ${User.plural} {
                        id
                    }
                }
            `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
                filters: {
                    String: {
                        CASE_INSENSITIVE: true,
                    },
                },
            },
        });

        await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                    CREATE (:${User} {id: "anotherUser"})
                `);

        const token = testHelper.createBearerToken(secret, { sub: "myuserid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [User.plural]: [
                {
                    id: userId,
                },
            ],
        });
    });
});
