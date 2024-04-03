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

        type ${Post} {
            id: ID! @id @unique
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
