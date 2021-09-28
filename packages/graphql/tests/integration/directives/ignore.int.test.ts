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

import { Driver, Session } from "neo4j-driver";
import faker from "faker";
import { graphql } from "graphql";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("@ignore directive", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type User {
                username: String!
                customField: String! @ignore
            }
        `;
        const resolvers = { User: { customField: () => "Some custom value" } };
        neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("removes a field from all but its object type, and resolves with a custom resolver", async () => {
        const username = faker.internet.userName();

        await session.run(`
            CALL {
                CREATE (u:User)
                SET u.username = "${username}"
                RETURN u
            }

            RETURN u
        `);

        const usersQuery = `
            query Users($username: String!) {
                users(where: { username: $username }) {
                    username
                    customField
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: usersQuery,
            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            variableValues: { username },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).users[0]).toEqual({
            username,
            customField: "Some custom value",
        });
    });
});
