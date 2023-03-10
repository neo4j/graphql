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

import { graphql } from "graphql";
import type { Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/3009", () => {
    let neo4j: Neo4j;
    let session: Session;

    beforeAll(() => {
        neo4j = new Neo4j();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => await session.close());
    afterAll(async () => await (await neo4j.getDriver()).close());

    test("custom resolvers should correctly format dates", async () => {
        const typeDefs = `
            type User {
                joinedAt: Date!
            }
        `;

        const resolvers = { Query: { users: () => [{ joinedAt: "2020-01-01" }] } };
        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });

        const query = `
            query {
                users {
                    joinedAt
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({ users: [{ joinedAt: "2020-01-01" }] });
    });

    test("custom resolvers should correctly format dateTimes", async () => {
        const typeDefs = `
            type User {
                joinedAt: DateTime!
            }
        `;

        const resolvers = { Query: { users: () => [{ joinedAt: new Date("2020-01-01").toISOString() }] } };
        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });

        const query = `
            query {
                users {
                    joinedAt
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({ users: [{ joinedAt: "2020-01-01T00:00:00.000Z" }] });
    });
});
