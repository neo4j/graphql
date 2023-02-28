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
import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { UniqueType } from "../../utils/graphql-types";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2630", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let HasName: UniqueType;
    let Post: UniqueType;
    let User: UniqueType;
    let Group: UniqueType;
    let PostSubject: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        HasName = new UniqueType("HasName");
        Post = new UniqueType("Post");
        User = new UniqueType("User");
        Group = new UniqueType("Group");
        PostSubject = new UniqueType("PostSubject");

        const typeDefs = `
          interface ${HasName} {
            name: String!
          }

          type ${Post} {
            id: ID! @id
            subject: ${PostSubject}! @relationship(type: "POST_FOR", direction: OUT)
          }

          type ${User} implements ${HasName} {
            name: String!
          }
          type ${Group} implements ${HasName} {
            name: String!
          }

          union ${PostSubject} = ${User} | ${Group}
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs, driver });
    });

    afterEach(async () => {
        await cleanNodes(session, [Post, User])
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to get fields in union of common interface", async () => {
        const query = `
          query {
              ${Post.plural} {
                id
                subject {
                  ... on ${HasName} {
                    name
                  }
                }
              }
          }
        `;

        const userId = generate({ charset: "alphabetic" });
        const postId = generate({ charset: "alphabetic" });
        const userName = generate({ charset: "alphabetic" });

        await session.run(
            `
                CREATE (post:${Post} { id: $postId })
                CREATE (user:${User} { id: $userId, name: $userName })
                MERGE (post)-[:POST_FOR]->(user)
            `,
            { userId, postId, userName },
        );

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Post.plural]: [
                {
                    id: postId,
                    subject: { name: userName },
                },
            ],
        });
    });
});
