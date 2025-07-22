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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("create with authorization", () => {
    const testHelper = new TestHelper();
    let Actor: UniqueType;
    let Movie: UniqueType;
    const secret = "secret";

    beforeEach(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            interface Content {
                id: ID
                content: String
                creator: [User!]! @declareRelationship
            }

            type User @node {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            type Comment implements Content @node {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type Post implements Content
                @node
                @authorization(
                    filter: [
                        {
                            operations: [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } }
                        }
                    ]
                ) {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            extend type User
                @authorization(
                    filter: [
                        {
                            operations: [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { id: { eq: "$jwt.sub" } } }
                        }
                    ]
                )

            extend type User {
                password: String!
                    @authorization(filter: [{ operations: [READ], where: { node: { id: { eq: "$jwt.sub" } } } }])
            }

            extend type Post {
                secretKey: String!
                    @authorization(
                        filter: [
                            { operations: [READ], where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } } }
                        ]
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("create and connect with authorization filters", async () => {
        const id = "123";

        // TODO: add something with filters
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                createUsers(
                    input: [
                        { id: $id, name: "Bob", password: "password", content: { connect: { where: { node: {} } } } }
                    ]
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.["createUsers"]).toEqual({ ["users"]: [{ id }] });

        const reFind = await testHelper.executeCypher(
            `
              MATCH (m:User {id: $id})
              RETURN m
            `,
            { id }
        );

        expect(reFind.records[0]?.toObject().m.properties).toMatchObject({ id });
    });
});
