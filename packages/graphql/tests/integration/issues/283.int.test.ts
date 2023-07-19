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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/283", () => {
    let driver: Driver;
    let neo4j: Neo4j;
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
                    columnName: "post"
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
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("DateTime values return correctly when using custom resolvers in the schema", async () => {
        const session = await neo4j.getSession();

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
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeFalsy();

            expect(typeof (result?.data as any)?.createPost?.datetime).toBe("string");

            await session.run(`MATCH (p:Post) WHERE p.title = "${title}" DELETE p`);
        } finally {
            await session.close();
        }
    });
});
