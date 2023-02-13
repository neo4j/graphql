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
import { generateUniqueType } from "../../utils/graphql-types";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/2620", () => {
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

        const hasNameType = generateUniqueType("HasName")
        const postType = generateUniqueType("Post")
        const userType = generateUniqueType("User")
        const groupType = generateUniqueType("Group")
        const unionType = generateUniqueType("PostSubject")

        const typeDefs = `
          interface ${hasNameType.name} {
            name: String!
          }

          type ${postType.name} {
            id: ID! @id
            subject: ${unionType.name}! @relationship(type: "POST_FOR", direction: OUT)
          }

          type ${userType.name} implements ${hasNameType.name} {
            name: String!
          }
          type ${groupType} implements ${hasNameType.name} {
            name: String!
          }

          union ${unionType.name} = ${userType.name} | ${groupType.name}
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
          query {
              ${postType.plural} {
                id
                subject {
                  ... on ${hasNameType.name} {
                    name
                  }
                }
              }
          }
        `;

        const userId = generate({ charset: "alphabetic" });
        const postId = generate({ charset: "alphabetic" });
        const userName = generate({ charset: "alphabetic" });

        try {
            await session.run(
                `
                    CREATE (post:${postType.name} { id: $postId })
                    CREATE (user:${userType.name} { id: $userId, name: $userName })
                    MERGE (post)-[:POST_FOR]->(user)
                `,
                { userId, postId, userName }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data?.[postType.plural]?.[0]?.subject?.name).toBe(userName);
        } finally {
            await session.close();
        }
    });
});
