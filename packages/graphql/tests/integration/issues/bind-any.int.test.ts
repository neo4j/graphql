/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("bind-any", () => {
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
            type ${User} @node {
                id: String!
            }

            type ${Organization} @node {
                id: String!
                users: [${User}!]! @relationship(type: "IS_MEMBER_OF", direction: IN)
            }

            type ${Group} @authorization(validate: [{ operations: [CREATE], when: [AFTER], where: { node: { organization_SINGLE: { users_SOME: { id_EQ: "$jwt.sub" } } } } }]) @node {
                id: String!
                name: String
                organization: [${Organization}!]! @relationship(type: "HAS_GROUP", direction: IN)
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
                        organization: { connect: { where: { node: { id_EQ: "org_1" } } } }
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
            type ${User} @node {
                id: String!
            }

            type ${Organization} @node {
                id: String!
                users: [${User}!]! @relationship(type: "IS_MEMBER_OF", direction: IN)
            }

            type ${Group} @authorization(validate: [{ operations: [CREATE], when: [AFTER], where: { node: { organization_SINGLE: { users_ALL: { id_EQ: "$jwt.sub" } } } } }]) @node {
                id: String!
                name: String
                organization: [${Organization}!]! @relationship(type: "HAS_GROUP", direction: IN)
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
                      organization: { connect: { where: { node: { id_EQ: "org_1" } } } }
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
