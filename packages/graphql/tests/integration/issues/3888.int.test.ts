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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/3888", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let Post: UniqueType;
    let User: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Post = new UniqueType("Post");
        User = new UniqueType("User");

        const typeDefs = `
            type ${User} {
                id: ID!
            }

            type ${Post} @authorization(filter: [{ where: { node: { author: { id: "$jwt.sub" } } } }]) {
                title: String!
                content: String!
                author: ${User}! @relationship(type: "AUTHORED", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await cleanNodesUsingSession(session, [Post, User]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not raise cardinality error when connecting on create", async () => {
        const createUser = `
            mutation {
                ${User.operations.create}(input: [{ id: "michel" }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
        `;

        const createPost = `
            mutation {
                ${Post.operations.create}(
                    input: [
                        { title: "Test1", content: "Test1", author: { connect: { where: { node: { id: "michel" } } } } }
                    ]
                ) {
                    ${Post.plural} {
                        title
                        author {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "michel" });

        const createUserResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createUser,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(createUserResult.errors).toBeFalsy();

        const createPostResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createPost,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(createPostResult.errors).toBeFalsy();
        expect(createPostResult.data).toEqual({
            [Post.operations.create]: {
                [Post.plural]: [
                    {
                        title: "Test1",
                        author: {
                            id: "michel",
                        },
                    },
                ],
            },
        });
    });
});
