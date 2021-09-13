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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import jsonwebtoken from "jsonwebtoken";
import { Socket } from "net";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("326", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw forbidden when user does not have correct allow on projection field(using Query)", async () => {
        const session = driver.session();

        const id = generate({
            charset: "alphabetic",
        });

        const typeDefs = `
            type Query {
                getSelf: [User]!
                  @cypher(
                    statement: """
                        MATCH (user:User { id: \\"${id}\\" })
                        RETURN user
                    """
                  )
            }

            type User {
                id: ID
                email: String! @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

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
                { id }
            );

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw forbidden when user does not have correct allow on projection field(using Mutation)", async () => {
        const session = driver.session();

        const id = generate({
            charset: "alphabetic",
        });

        const typeDefs = `
            type Mutation {
                getSelf: [User]!
                  @cypher(
                    statement: """
                        MATCH (user:User { id: \\"${id}\\" })
                        RETURN user
                    """
                  )
            }

            type User {
                id: ID
                email: String! @auth(rules: [{ operations: [READ], allow: { id: "$jwt.sub" } }])
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

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
                { id }
            );

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });
});
