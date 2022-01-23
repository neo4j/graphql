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
import faker from "faker";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

const testLabel = generate({ charset: "alphabetic" });
describe("@ignore directive", () => {
    let driver: Driver;

    const typeDefs = `
        type User {
            id: ID!
            firstName: String!
            lastName: String!
            fullName: String @ignore(require: ["firstName", "lastName"])
        }
    `;

    const user = {
        id: generate(),
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
    };

    const fullName = ({ firstName, lastName }) => `${firstName} ${lastName}`;

    const resolvers = {
        User: { fullName },
    };

    const { schema } = new Neo4jGraphQL({ typeDefs, resolvers });

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();
        await session.run(
            `
            CREATE (user:User:${testLabel}) SET user = $user
        `,
            { user }
        );
        await session.close();
    });

    afterAll(async () => {
        const session = driver.session();
        await session.run(`MATCH (n:${testLabel}) DETACH DELETE n`);
        await session.close();
        await driver.close();
    });

    test("removes a field from all but its object type, and resolves with a custom resolver", async () => {
        const source = `
            query Users($userId: ID!) {
                users(where: { id: $userId }) {
                    id
                    firstName
                    lastName
                    fullName
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source,
            contextValue: { driver },
            variableValues: { userId: user.id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).users[0]).toEqual({
            ...user,
            fullName: fullName(user),
        });
    });

    test("resolves field with custom resolver without required fields in selection set", async () => {
        const source = `
            query Users($userId: ID!) {
                users(where: { id: $userId }) {
                    id
                    fullName
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source,
            contextValue: { driver },
            variableValues: { userId: user.id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).users[0]).toEqual({
            id: user.id,
            fullName: fullName(user),
        });
    });

    test("resolves field with custom resolver with required field(s) aliased in selection set", async () => {
        const source = `
            query Users($userId: ID!) {
                users(where: { id: $userId }) {
                    id
                    f: firstName
                    fullName
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source,
            contextValue: { driver },
            variableValues: { userId: user.id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).users[0]).toEqual({
            id: user.id,
            f: user.firstName,
            fullName: fullName(user),
        });
    });
});
