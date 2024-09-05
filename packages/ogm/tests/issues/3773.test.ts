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

import type { Neo4jGraphQLContext } from "@neo4j/graphql/src";
import type { Driver, Session } from "neo4j-driver";
import { OGM } from "../../src";
import neo4j from "../integration/neo4j";
import { UniqueType } from "../utils/utils";

describe("https://github.com/neo4j/graphql/issues/3773", () => {
    let driver: Driver;
    let session: Session;

    let EventType: UniqueType;
    let UserType: UniqueType;

    beforeAll(async () => {
        driver = await neo4j();
    });

    beforeEach(() => {
        session = driver.session();
        EventType = new UniqueType("Event");
        UserType = new UniqueType("User");
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should re-create issue and return types without throwing", async () => {
        const typeDefs = /* GraphQL */ `
            type ${EventType} @node {
                name: String!
                userAttending: Boolean!
                    @cypher(
                        statement: """
                        MATCH (user:${UserType} {id: $jwt.sub})-[:ATTENDS]->(this)
                        RETURN COUNT(user) <> 0 as result
                        """
                        columnName: "result"
                    )
            }

            type ${UserType} @node {
                id: ID!
                events: [${EventType}!]! @relationship(type: "ATTENDS", direction: OUT)
            }
        `;

        const ogm = new OGM({
            typeDefs,
        });

        await ogm.init();

        const User = ogm.model(UserType.name);

        const context: Neo4jGraphQLContext = {
            cypherParams: {
                jwt: {
                    sub: "1",
                },
            },
            executionContext: session,
        };

        const users = await User.create({
            selectionSet: `
            {
              ${UserType.plural} {
                id
                events {
                  userAttending
                }
              }
            }
            `,
            input: {
                id: "1",
                events: {
                    create: [{ node: { name: "Event 1" } }],
                },
            },
            context,
        });

        expect(users[UserType.plural][0].events[0].userAttending).toBe(true);
    });
});
