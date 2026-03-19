/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2630", () => {
    const testHelper = new TestHelper();

    let HasName: UniqueType;
    let Post: UniqueType;
    let User: UniqueType;
    let Group: UniqueType;
    let PostSubject: UniqueType;

    beforeEach(async () => {
        HasName = testHelper.createUniqueType("HasName");
        Post = testHelper.createUniqueType("Post");
        User = testHelper.createUniqueType("User");
        Group = testHelper.createUniqueType("Group");
        PostSubject = testHelper.createUniqueType("PostSubject");

        const typeDefs = `
          interface ${HasName} {
            name: String!
          }

          type ${Post} @node {
            id: ID! @id
            subject: [${PostSubject}!]! @relationship(type: "POST_FOR", direction: OUT)
          }

          type ${User} implements ${HasName} @node {
            name: String!
          }
          type ${Group} implements ${HasName} @node {
            name: String!
          }

          union ${PostSubject} = ${User} | ${Group}
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
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

        await testHelper.executeCypher(
            `
                CREATE (post:${Post} { id: $postId })
                CREATE (user:${User} { id: $userId, name: $userName })
                MERGE (post)-[:POST_FOR]->(user)
            `,
            { userId, postId, userName }
        );

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Post.plural]: [
                {
                    id: postId,
                    subject: [{ name: userName }],
                },
            ],
        });
    });
});
