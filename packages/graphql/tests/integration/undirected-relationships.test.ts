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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { getQuerySource } from "../utils/get-query-source";
import { UniqueType } from "../utils/graphql-types";

describe("undirected relationships", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("query for an undirected relationship", async () => {
        const userType = new UniqueType("User");
        const typeDefs = gql`
            type ${userType.name} {
                name: String!
                friends: [${userType.name}!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = gql`
            query {
                ${userType.plural}(where: {name: "Ford"}) {
                    name
                    friends: friends(directed: false) {
                        name
                    }
                    directedFriends: friends(directed: true) {
                        name
                    }
                }
            }
        `;
        await session.run(`
                CREATE (a:${userType.name} {name: "Arthur"})
                CREATE (b:${userType.name} {name: "Ford"})
                CREATE (a)-[:FRIENDS_WITH]->(b)
            `);
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: getQuerySource(query),
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [userType.plural]: [
                {
                    name: "Ford",
                    directedFriends: [],
                    // The real treasure we made along the way
                    friends: [
                        {
                            name: "Arthur",
                        },
                    ],
                },
            ],
        });
    });

    test("query for an undirected relationship on single relationship", async () => {
        const userType = new UniqueType("User");
        const typeDefs = gql`
            type ${userType.name} {
                name: String!
                friend: ${userType.name} @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = gql`
            query {
                ${userType.plural}(where: {name: "Ford"}) {
                    name
                    friend: friend(directed: false) {
                        name
                    }
                    directedFriend: friend(directed: true) {
                        name
                    }
                }
            }
        `;
        await session.run(`
                CREATE (a:${userType.name} {name: "Arthur"})
                CREATE (b:${userType.name} {name: "Ford"})
                CREATE (a)-[:FRIENDS_WITH]->(b)
            `);
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: getQuerySource(query),
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [userType.plural]: [
                {
                    name: "Ford",
                    directedFriend: null,
                    friend: {
                        name: "Arthur",
                    },
                },
            ],
        });
    });
});
