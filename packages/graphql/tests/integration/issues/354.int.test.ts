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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/354", () => {
    const testHelper = new TestHelper();

    beforeAll(() => {});

    afterAll(async () => {
        await testHelper.close();
    });

    test("should throw when creating a node without a mandatory relationship", async () => {
        const testComment = testHelper.createUniqueType("Comment");
        const testPost = testHelper.createUniqueType("Post");

        const typeDefs = gql`
            type ${testComment.name} {
                comment_id: ID!
                post: ${testPost.name}! @relationship(type: "HAS_POST", direction: OUT)
            }

            type ${testPost.name} {
                post_id: ID!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const missingNodeId = generate({
            charset: "alphabetic",
        });

        const commentId = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                ${testComment.operations.create}(
                    input: [{
                        comment_id: "${commentId}",
                        post: {
                            connect: {
                                where: { node: { post_id: "${missingNodeId}" } }
                            }
                        }
                    }]
                ) {
                    ${testComment.plural} {
                        comment_id
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeTruthy();
        expect((result.errors as any[])[0].message).toBe(`${testComment.name}.post required exactly once`);
    });
});
