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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import gql from "graphql-tag";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/4112", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    const Category = new UniqueType("Category");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    CREATE (:${Category} {name: "test"});
                `
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                    MATCH (c:${Category} {name: "test"})
                    DELETE c;
                `
            );
        } finally {
            await session.close();
        }
        await driver.close();
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
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

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

        const gqlResultUser = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                token: nonAdminToken,
            }),
        });

        expect((gqlResultUser.errors as any[])[0].message).toBe("Unauthenticated");

        const adminToken = createBearerToken(secret, {
            groups: ["user", "admin"],
        });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token: adminToken }),
        });

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
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

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

        const gqlResultUser = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                token: nonAdminToken,
            }),
        });

        expect((gqlResultUser.errors as any[])[0].message).toBe("Unauthenticated");

        const adminToken = createBearerToken(secret, {
            myApplication: { roles: ["user", "admin"] },
        });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token: adminToken }),
        });

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
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

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

        const gqlResultUser = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                token: nonAdminToken,
            }),
        });

        expect((gqlResultUser.errors as any[])[0].message).toBe("Unauthenticated");

        const adminToken = createBearerToken(secret, {
            "https://github.com/claims": { "https://github.com/claims/roles": ["admin"] },
        });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token: adminToken }),
        });

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
        const neoSchema = new Neo4jGraphQL({
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

        const gqlResultUser = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                token: nonAdminToken,
            }),
        });

        expect((gqlResultUser.errors as any[])[0].message).toBe("Unauthenticated");

        const adminToken = createBearerToken(secret, {
            myApplication: { roles: ["user", "admin"] },
        });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token: adminToken }),
        });

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data as any).toEqual({
            categories: "test",
        });
    });
});
