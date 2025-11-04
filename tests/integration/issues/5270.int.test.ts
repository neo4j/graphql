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

describe("https://github.com/neo4j/graphql/issues/5270", () => {
    let User: UniqueType;
    let UserBlockedUser: UniqueType;

    const secret = "secret";
    const testHelper = new TestHelper();

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        UserBlockedUser = testHelper.createUniqueType("UserBlockedUser");

        const typeDefs = /* GraphQL */ `
            type ${User} @node(labels: ["${User}"]) @authorization(
                filter: [
                    { where: { node: { NOT: { blockedUsers_SOME: { to: { id: "$jwt.sub" } } } } } },
                ]
            ) {
                id: ID! @unique @id
                blockedUsers: [${UserBlockedUser}!]! @relationship(type: "HAS_BLOCKED", direction: OUT)
            }
        
            type ${UserBlockedUser} @node(labels: ["${UserBlockedUser}"]) @authorization(
                filter: [
                    { where: { node: { from: { id: "$jwt.sub" } } } }
                ]
            ) {
                id: ID! @id @unique
                from: ${User}! @relationship(type: "HAS_BLOCKED", direction: IN) @settable(onCreate: true, onUpdate: false)
                to: ${User}! @relationship(type: "IS_BLOCKING", direction: OUT) @settable(onCreate: true, onUpdate: false)
            }
        
            type Query {
                getMe: ${User} @cypher(statement: "OPTIONAL MATCH (u:${User} {id: $jwt.sub}) RETURN u", columnName: "u")
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

    test("should return filtered results according to authorization rule", async () => {
        const query = `
            query GetMe {
                getMe {
                    id
                    __typename
                }
            }
        `;

        const userId = "my-user-id";

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})
            `);

        const token = createBearerToken(secret, {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({ getMe: { id: userId, __typename: User.name } });
    });
});
