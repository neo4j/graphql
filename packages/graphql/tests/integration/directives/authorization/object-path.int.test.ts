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
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("auth/object-path", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should use object path with allow", async () => {
        const typeDefs = `
            type JWTPayload @jwt {
                nestedSub: String! @jwtClaim(path: "nested.object.path.sub")
            }

            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id: "$jwt.nestedSub" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
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

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})
            `);

        const token = createBearerToken(secret, {
            nested: {
                object: {
                    path: {
                        sub: userId,
                    },
                },
            },
        });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        const [user] = (gqlResult.data as any)[User.plural];
        expect(user).toEqual({ id: userId });
    });

    test("should use $context value plucking on auth", async () => {
        const typeDefs = `
            type ${User} {
                id: ID
            }

            type ${Post} {
                id: ID
                creator: ${User}! @relationship(type: "HAS_POST", direction: IN)
            }

            extend type ${Post} @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { creator: { id: "$context.userId" } } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${Post.plural}(where: {id: "${postId}"}) {
                    id
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

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})-[:HAS_POST]->(:${Post} {id: "${postId}"})
            `);

        const token = createBearerToken(secret);

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: { token, userId },
        });

        expect(gqlResult.errors).toBeUndefined();

        const [post] = (gqlResult.data as any)[Post.plural];
        expect(post).toEqual({ id: postId });
    });

    test("should use object path with roles", async () => {
        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]! @jwtClaim(path: "https://github\\\\.com/claims.https://github\\\\.com/claims/roles")
            }

            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { jwt: { roles_INCLUDES: "admin" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
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
            },
        });

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})
            `);

        const token = createBearerToken(secret, {
            "https://github.com/claims": { "https://github.com/claims/roles": ["admin"] },
        });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();
        const [user] = (gqlResult.data as any)[User.plural];

        expect(user).toEqual({ id: userId });
    });

    test("should use object path with JWT endpoint", async () => {
        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]! 
            }

            type ${User} {
                id: ID
            }

            extend type ${User} @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { jwt: { roles_INCLUDES: "admin" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${User.plural}(where: {id: "${userId}"}) {
                    id
                }
            }
        `;

        // Pass the well-known JWKS Endpoint
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: {
                        url: "https://www.YOUR_DOMAIN.com/.well-known/jwks.json",
                    },
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:${User} {id: "${userId}"})
            `);

        // Not a valid JWT since signature shall never match
        const token = createBearerToken(secret);

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        // Since we don't have a valid JWKS Endpoint, we will always get an error validating our JWKS
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
