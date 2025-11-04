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

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2474", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Organization: UniqueType;
    let Group: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Organization = testHelper.createUniqueType("Organization");
        Group = testHelper.createUniqueType("Group");

        await testHelper.executeCypher(`
        CREATE(o:${Organization} { id: "org_1" })
        CREATE(:${User} { id: "user1" })-[:IS_MEMBER_OF]->(o)
        CREATE(:${User} { id: "user2" })-[:IS_MEMBER_OF]->(o)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should allow the operation when predicate is any", async () => {
        const typeDefs = `
            type ${User} {
                id: String!
            }

            type ${Organization} {
                id: String!
                users: [${User}!]! @relationship(type: "IS_MEMBER_OF", direction: IN)
            }

            type ${Group} @authorization(validate: [{ operations: [CREATE], when: [AFTER], where: { node: { organization: { users_SOME: { id: "$jwt.sub" } } } } }]) {
                id: String!
                name: String
                organization: ${Organization}! @relationship(type: "HAS_GROUP", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = `
            mutation {
                ${Group.operations.create}(
                    input: {
                        id: "grp_1"
                        name: "AdminGroup"
                        organization: { connect: { where: { node: { id: "org_1" } } } }
                    }
                ) {
                    ${Group.plural} {
                        id
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: {
                    sub: "user1",
                },
            },
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Group.operations.create]: {
                [Group.plural]: [
                    {
                        id: "grp_1",
                    },
                ],
            },
        });
    });

    test("should disallow the operation when predicate is all (default behaviour)", async () => {
        const typeDefs = `
            type ${User} {
                id: String!
            }

            type ${Organization} {
                id: String!
                users: [${User}!]! @relationship(type: "IS_MEMBER_OF", direction: IN)
            }

            type ${Group} @authorization(validate: [{ operations: [CREATE], when: [AFTER], where: { node: { organization: { users_ALL: { id: "$jwt.sub" } } } } }]) {
                id: String!
                name: String
                organization: ${Organization}! @relationship(type: "HAS_GROUP", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = `
          mutation {
              ${Group.operations.create}(
                  input: {
                      id: "grp_1"
                      name: "AdminGroup"
                      organization: { connect: { where: { node: { id: "org_1" } } } }
                  }
              ) {
                  ${Group.plural} {
                      id
                  }
              }
          }
      `;

        const result = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: {
                    sub: "user1",
                },
            },
        });

        expect(result.errors).toEqual([new GraphQLError("Forbidden")]);
    });
});
