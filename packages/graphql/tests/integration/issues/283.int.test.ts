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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/283", () => {
    let driver: Driver;
    const typeDefs = gql`
        type Mutation {
            login: String
            createPost(input: PostCreateInput!): Post!
                @cypher(
                    statement: """
                    CREATE (post:Post)
                    SET
                      post = $input,
                      post.datetime = datetime(),
                      post.id = randomUUID()
                    RETURN post
                    """
                )
        }

        type Post {
            id: ID! @id
            title: String!
            datetime: DateTime @readonly @timestamp(operations: [CREATE])
        }
    `;
    // Presence of a custom resolver was causing the bug
    const resolvers = {
        Mutation: {
            login: () => {
                return { token: "token" };
            },
        },
    };

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("DateTime values return correctly when using custom resolvers in the schema", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers, driver });

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

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(result.errors).toBeFalsy();

            expect(typeof result?.data?.createPost?.datetime).toBe("string");

            await session.run(`MATCH (p:Post) WHERE p.title = "${title}" DELETE p`);
        } finally {
            await session.close();
        }
    });
});
