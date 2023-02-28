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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("326", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw forbidden when user does not have correct allow on projection field(using Query)", async () => {
        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
        });

        const typeDefs = `
            type Query {
                getSelf: [User]!
                  @cypher(
                    statement: """
                        MATCH (user:User { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type User {
                id: ID
                email: String! @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = `
            {
                getSelf {
                    email
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:User {id: $id, email: randomUUID()})
                `,
                { id },
            );

            const req = createJwtRequest(secret, { sub: "invalid" });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw forbidden when user does not have correct allow on projection field(using Mutation)", async () => {
        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
        });

        const typeDefs = `
            type Mutation {
                getSelf: [User]!
                  @cypher(
                    statement: """
                        MATCH (user:User { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type User {
                id: ID
                email: String! @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });

        const query = `
            mutation {
                getSelf {
                    email
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:User {id: $id, email: randomUUID()})
                `,
                { id },
            );

            const req = createJwtRequest(secret, { sub: "invalid" });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id },
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        } finally {
            await session.close();
        }
    });
});
