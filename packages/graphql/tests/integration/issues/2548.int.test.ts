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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodes } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/2548", () => {
    const secret = "secret";
    let driver: Driver;
    let neo4j: Neo4jHelper;

    let User: UniqueType;

    let schema: GraphQLSchema;

    let query: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        User = new UniqueType("User");

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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: { authorization: { key: secret } },
        });

        schema = await neoSchema.getSchema();

        const session = await neo4j.getSession();

        await session.run(`
            CREATE (:${User} { userId: "1", isPublic: true })
            CREATE (:${User} { userId: "2", isPublic: false })
        `);

        await session.close();
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodes(driver, [User]);
        await session.close();
        await driver.close();
    });

    test("should return public information for unauthenticated request", async () => {
        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });

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

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

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
