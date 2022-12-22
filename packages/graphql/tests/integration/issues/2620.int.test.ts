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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";

describe("2620", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to get fields in union of common interface", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
          interface HasName {
            name: String!
          }

          type Post {
            id: ID! @id
            subject: PostSubject! @relationship(type: "POST_FOR", direction: OUT)
          }

          type User implements HasName {
            name: String!
          }
          type Group implements HasName {
            name: String!
          }

          union PostSubject = User | Group
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
          query {
              posts {
                id
                subject {
                  ... on HasName {
                    name
                  }
                }
              }
          }
        `;

        const userId = generate({
            charset: "alphabetic",
        });
        const postId = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(
                `
                    CREATE (post:Post { id: $postId })
                    CREATE (user:User { id: $userId, name: "user-name" })
                    MERGE (post)-[:POST_FOR]->(user)
            `,
                {
                    userId,
                    postId,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)?.posts?.[0]?.subject?.id).toBe(userId);
        } finally {
            await session.close();
        }
    });
});
