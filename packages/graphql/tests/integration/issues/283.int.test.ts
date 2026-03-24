/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/283", () => {
    const testHelper = new TestHelper();
    let Post: UniqueType;
    let typeDefs: string;

    // Presence of a custom resolver was causing the bug
    const resolvers = {
        Mutation: {
            login: () => {
                return { token: "token" };
            },
        },
    };

    beforeAll(() => {
        Post = testHelper.createUniqueType("Post");

        typeDefs = `
        type Mutation {
            login: String
            createPost(input: ${Post}CreateInput!): ${Post}!
                @cypher(
                    statement: """
                    CREATE (post:${Post})
                    SET
                      post = $input,
                      post.datetime = datetime(),
                      post.id = randomUUID()
                    RETURN post
                    """
                    columnName: "post"
                )
        }

        type ${Post} @node {
            id: ID! @id
            title: String!
            datetime: DateTime @timestamp(operations: [CREATE])
        }
    `;
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("DateTime values return correctly when using custom resolvers in the schema", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs, resolvers });

        const title = generate({ charset: "alphabetic" });

        const mutation = `
            mutation {
                createPost(input: { title: "${title}" }) {
                    id
                    title
                    datetime
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeFalsy();

        expect(typeof (result?.data as any)?.createPost?.datetime).toBe("string");

        await testHelper.executeCypher(`MATCH (p:${Post}) WHERE p.title = "${title}" DELETE p`);
    });
});
