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

describe("https://github.com/neo4j/graphql/issues/3901", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let Serie: UniqueType;
    let Season: UniqueType;
    let User: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Serie = new UniqueType("Serie");
        Season = new UniqueType("Season");
        User = new UniqueType("User");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${User} {
                id: ID! 
                series: [${Serie}!]! @relationship(type: "PUBLISHER", direction: OUT)
            }

            type ${Serie}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            when: [AFTER]
                            where: {
                                AND: [
                                    { node: { publisher: { id: "$jwt.sub" } } }
                                    { jwt: { roles_INCLUDES: "verified" } }
                                    { jwt: { roles_INCLUDES: "creator" } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id
                title: String!

                seasons: [${Season}!]! @relationship(type: "SEASON_OF", direction: IN)
                publisher: ${User}! @relationship(type: "PUBLISHER", direction: IN)
            }

            type ${Season}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE]
                            when: [AFTER]
                            where: {
                                AND: [
                                    { node: { serie: { publisher: { id: "$jwt.sub" } } } }
                                    { jwt: { roles_INCLUDES: "verified" } }
                                    { jwt: { roles_INCLUDES: "creator" } }
                                ]
                            }
                        }
                    ]
                ) {
                id: ID! @id
                number: Int!
                serie: ${Serie}! @relationship(type: "SEASON_OF", direction: OUT)
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
        await cleanNodesUsingSession(session, [Serie, Season, User]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not raise cardinality error when connecting on create", async () => {
        const createUser = /* GraphQL */ `
            mutation {
                ${User.operations.create}(input: [{ id: "michel" }]) {
                    ${User.plural} {
                        id
                    }
                }
            }
        `;

        const createPost = /* GraphQL */ `
            mutation {
                ${Serie.operations.create}(
                    input: [
                        {
                            title: "title"
                            publisher: { connect: { where: { node: { id: "michel" } } } }
                            seasons: { create: { node: { number: 1 } } }
                        }
                    ]
                ) {
                    ${Serie.plural} {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "michel", roles: ["verified", "creator"] });

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
            [Serie.operations.create]: {
                [Serie.plural]: [
                    {
                        title: "title",
                    },
                ],
            },
        });
    });
});
