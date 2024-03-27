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

import gql from "graphql-tag";
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4112", () => {
    const testHelper = new TestHelper();
    let Category: UniqueType;

    beforeEach(async () => {
        Category = testHelper.createUniqueType("Category");

        await testHelper.executeCypher(
            `
                    CREATE (:${Category} {name: "test"});
                `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should use jwtClaim alias without dots", async () => {
        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]! @jwtClaim(path: "groups")
            }

            type ${Category} @authentication(operations: [READ], jwt: { roles_INCLUDES: "admin" }) {
                name: String! @unique
            }
        `;

        const secret = "123456";
        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

        const query = `
            query  {
               ${Category.plural} {
                 name
               }
            }
        `;

        const nonAdminToken = createBearerToken(secret, {
            groups: ["user"],
        });

        const gqlResultUser = await testHelper.executeGraphQLWithToken(query, nonAdminToken);

        expect((gqlResultUser.errors as any[])[0].message).toBe("Unauthenticated");

        const adminToken = createBearerToken(secret, {
            groups: ["user", "admin"],
        });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, adminToken);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data as any).toEqual({
            [Category.plural]: [
                {
                    name: "test",
                },
            ],
        });
    });

    test("should use jwtClaim alias with dots", async () => {
        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]! @jwtClaim(path: "myApplication.roles")
            }

            type ${Category} @authentication(operations: [READ], jwt: { roles_INCLUDES: "admin" }) {
                name: String! @unique
            }
        `;

        const secret = "123456";
        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

        const query = `
            query  {
               ${Category.plural} {
                 name
               }
            }
        `;

        const nonAdminToken = createBearerToken(secret, {
            myApplication: { roles: ["user"] },
        });

        const gqlResultUser = await testHelper.executeGraphQLWithToken(query, nonAdminToken);

        expect((gqlResultUser.errors as any[])[0].message).toBe("Unauthenticated");

        const adminToken = createBearerToken(secret, {
            myApplication: { roles: ["user", "admin"] },
        });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, adminToken);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data as any).toEqual({
            [Category.plural]: [
                {
                    name: "test",
                },
            ],
        });
    });

    test("should use jwtClaim alias with dots and slash", async () => {
        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]! @jwtClaim(path: "https://github\\\\.com/claims.https://github\\\\.com/claims/roles")
            }

            type ${Category} @authentication(operations: [READ], jwt: { roles_INCLUDES: "admin" }) {
                name: String! @unique
            }
        `;

        const secret = "123456";
        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

        const query = `
            query  {
               ${Category.plural} {
                 name
               }
            }
        `;

        const nonAdminToken = createBearerToken(secret, {
            "https://github.com/claims": { "https://github.com/claims/roles": ["user"] },
        });

        const gqlResultUser = await testHelper.executeGraphQLWithToken(query, nonAdminToken);

        expect((gqlResultUser.errors as any[])[0].message).toBe("Unauthenticated");

        const adminToken = createBearerToken(secret, {
            "https://github.com/claims": { "https://github.com/claims/roles": ["admin"] },
        });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, adminToken);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data as any).toEqual({
            [Category.plural]: [
                {
                    name: "test",
                },
            ],
        });
    });

    test("should use jwtClaim alias on top-level cypher fields", async () => {
        const typeDefs = gql`
            type JWT @jwt {
                roles: [String!]! @jwtClaim(path: "myApplication.roles")
            }

            type Query {
                categories: String
                    @cypher(
                        statement: """
                        RETURN "test" AS x
                        """
                        columnName: "x"
                    )
                    @authentication(jwt: { roles_INCLUDES: "admin" })
            }
        `;

        const secret = "123456";
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

        const query = `
            query  {
                categories
            }
        `;

        const nonAdminToken = createBearerToken(secret, {
            myApplication: { roles: ["user"] },
        });

        const gqlResultUser = await testHelper.executeGraphQLWithToken(query, nonAdminToken);

        expect((gqlResultUser.errors as any[])[0].message).toBe("Unauthenticated");

        const adminToken = createBearerToken(secret, {
            myApplication: { roles: ["user", "admin"] },
        });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, adminToken);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data as any).toEqual({
            categories: "test",
        });
    });
});
