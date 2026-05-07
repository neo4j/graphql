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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7285", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    const secret = "secret";
    let Movie: UniqueType;
    let Director: UniqueType;
    let Genre: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Director = testHelper.createUniqueType("Director");
        Genre = testHelper.createUniqueType("Genre");

        typeDefs = /* GraphQL */ `
            type ${Movie} {
                Id: ID! @id @unique
                Name: String!
                Directors: [${Director}!]! @relationship(type: "DIRECTED", direction: IN)
                Genres: [${Genre}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }

            type ${Director}
                @authorization(
                    validate: [
                        { operations: [CREATE], where: { node: { MyRoles_INCLUDES: "admin" } } }
                    ]
                ) {
                Id: ID! @id @unique
                Name: String!
                MyRoles: [String!]!
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN ['admin'] as roles
                        """
                        columnName: "roles"
                    )
                Movies: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type ${Genre} {
                Id: ID! @id @unique
                Name: String!
                Movies: [${Movie}!]! @relationship(type: "IN_GENRE", direction: IN)
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

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create a Movie with nested Director and connectOrCreate Genre", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [
                    {
                        Name: "A Movie"
                        Directors: { create: [{ node: { Name: "A Director" } }] }
                        Genres: {
                            connectOrCreate: [
                                {
                                    onCreate: { node: { Name: "Action" } }
                                    where: { node: { Id: "action" } }
                                }
                            ]
                        }
                    }
                ]) {
                    info {
                        nodesCreated
                        relationshipsCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { roles: ["admin"] });
        const result = await testHelper.executeGraphQLWithToken(mutation, token);

        expect(result.errors).toBeDefined();
        expect(result.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    message: expect.stringContaining("not defined"),
                }),
            ])
        );
    });
});
