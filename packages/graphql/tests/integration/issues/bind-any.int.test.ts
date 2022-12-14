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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver, Session } from "neo4j-driver";
import { graphql, GraphQLError } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2474", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let typeDefs: string;
    let session: Session;

    let User: UniqueType;
    let Organization: UniqueType;
    let Group: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        User = generateUniqueType("User");
        Organization = generateUniqueType("Organization");
        Group = generateUniqueType("Group");

        session = await neo4j.getSession();

        typeDefs = `
            type ${User} {
                id: String!
            }

            type ${Organization} {
                id: String!
                users: [${User}!]! @relationship(type: "IS_MEMBER_OF", direction: IN)
            }

            type ${Group} @auth(rules: [{ operations: [CREATE], bind: { organization: { users: { id: "$jwt.sub" } } } }]) {
                id: String!
                name: String
                organization: ${Organization}! @relationship(type: "HAS_GROUP", direction: IN)
            }
        `;

        await session.run(`
        CREATE(o:${Organization} { id: "org_1" })
        CREATE(:${User} { id: "user1" })-[:IS_MEMBER_OF]->(o)
        CREATE(:${User} { id: "user2" })-[:IS_MEMBER_OF]->(o)
        `);
    });

    afterEach(async () => {
        await cleanNodes(session, [User, Organization, Group]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should allow the operation when predicate is any", async () => {
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                    bindPredicate: "any",
                }),
            },
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

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                jwt: {
                    sub: "user1",
                },
            }),
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
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
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

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                jwt: {
                    sub: "user1",
                },
            }),
        });

        expect(result.errors).toEqual([new GraphQLError("Forbidden")]);
    });
});
