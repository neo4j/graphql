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

describe("https://github.com/neo4j/graphql/issues/1115", () => {
    let parentType: UniqueType;
    let childType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        parentType = testHelper.createUniqueType("Parent");
        childType = testHelper.createUniqueType("Child");

        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type ${parentType} {
                children: [${childType}!]! @relationship(type: "HAS", direction: IN)
            }

            type ${childType} {
                tcId: String @unique
            }

            extend type ${childType}
                @authorization(
                    validate: [
                        { operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { jwt: { roles_INCLUDES: "upstream" } } }
                        { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
                    ]
                )
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should not throw on multiple connectOrCreate with auth", async () => {
        await testHelper.executeCypher(`CREATE (:${parentType})<-[:HAS]-(:${childType} {tcId: "123"})`);

        const token = testHelper.createBearerToken("secret", { roles: ["upstream"] });
        const query = `
        mutation {
          ${parentType.operations.update}(
            connectOrCreate: {
              children: [
                {
                  where: { node: { tcId: "123" } }
                  onCreate: { node: { tcId: "123" } }
                }
                {
                  where: { node: { tcId: "456" } }
                  onCreate: { node: { tcId: "456" } }
                }
              ]
            }
          ) {
            info {
              nodesCreated
            }
          }
        }
        `;

        const res = await testHelper.executeGraphQLWithToken(query, token);

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            [parentType.operations.update]: { info: { nodesCreated: 1 } },
        });
    });
});
