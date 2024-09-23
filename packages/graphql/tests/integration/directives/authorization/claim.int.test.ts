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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("auth claim", () => {
    const testHelper = new TestHelper();

    let Product: UniqueType;
    let User: UniqueType;

    const secret = "secret";

    beforeEach(async () => {
        Product = testHelper.createUniqueType("Product");
        User = testHelper.createUniqueType("User");
        await testHelper.executeCypher(
            `CREATE(p:${Product} {id: "1", name: "Marvin"})
            CREATE(u:${User} {id: "1", password: "dontpanic42", name: "Arthur"})
        `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should allow checks against standard claim properties when jwt payload is undefined", async () => {
        const typeDefs = `
                type ${User} @authorization(validate: [ { operations: [READ], when: BEFORE, where: { jwt: { iss: "test" } } }]) {
                    id: ID
                    password: String
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

        const query = `
            {
                ${User.plural} {
                    password
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { iss: "test" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.data).toEqual({
            [User.plural]: [
                {
                    password: "dontpanic42",
                },
            ],
        });
        expect(gqlResult.errors).toBeUndefined();
    });

    test("should allow checks against standard claim properties when jwt payload is defined", async () => {
        const typeDefs = `
                type JWTPayload @jwt {
                    myClaim: String
                }

                type ${User} @authorization(validate: [ { operations: [READ], when: BEFORE, where: { jwt: { iss: "test" } } }]) {
                    id: ID
                    password: String
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

        const query = `
            {
                ${User.plural} {
                    password
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { iss: "test" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.data).toEqual({
            [User.plural]: [
                {
                    password: "dontpanic42",
                },
            ],
        });
        expect(gqlResult.errors).toBeUndefined();
    });
});
