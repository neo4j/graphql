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

// Reference: https://github.com/neo4j/graphql/pull/330
// Reference: https://github.com/neo4j/graphql/pull/303#discussion_r671148932
describe("unauthenticated-requests", () => {
    const secret = "secret";
    const testHelper = new TestHelper();
    let User: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should throw Unauthenticated when trying to pluck undefined value with allow", async () => {
        const typeDefs = `
            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(validate: [{ when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
        `;

        const query = `
            {
                ${User.plural} {
                    id
                }
            }
        `;

        await testHelper.executeCypher(`CREATE (:${User} { id: "ID" })`);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken(secret);

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw Unauthenticated when trying to pluck undefined value with where", async () => {
        const typeDefs = `
            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
        `;

        const query = `
            {
                ${User.plural} {
                    id
                }
            }
        `;

        await testHelper.executeCypher(`CREATE (:${User} { id: "ID" })`);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = testHelper.createBearerToken(secret);

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [User.plural]: [],
        });
    });

    test("should throw Unauthenticated when trying to pluck undefined value with bind", async () => {
        const typeDefs = `
            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(validate: [{ when: AFTER, where: { node: { id: "$jwt.sub" } } }])
        `;

        const query = `
            mutation {
                ${User.operations.create}(input: [{ id: "some-id" }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = testHelper.createBearerToken(secret);

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    // If the below test starts failing, we will need to change the default value that we use for non-existent JWT claims
    test("maps are not supported in the database and can be used as JWT default value", async () => {
        const typeDefs = `
            type ${User} {
                id: ID
            }
        `;

        // This is not really used, only needed to execute runCypher afterwards
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await expect(() => testHelper.executeCypher(`CREATE (:${User} { shouldFail: {} })`)).rejects.toThrow(
            "Property values can only be of primitive types or arrays thereof. Encountered: Map{}."
        );
    });
});
