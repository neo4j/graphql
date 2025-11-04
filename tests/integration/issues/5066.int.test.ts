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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5066", () => {
    let User: UniqueType;
    let AdminGroup: UniqueType;
    let UserBlockedUser: UniqueType;
    let Party: UniqueType;

    const secret = "secret";
    const testHelper = new TestHelper();

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        AdminGroup = testHelper.createUniqueType("AdminGroup");
        UserBlockedUser = testHelper.createUniqueType("UserBlockedUser");
        Party = testHelper.createUniqueType("Party");

        const typeDefs = /* GraphQL */ `
            type ${AdminGroup} @node(labels: ["${AdminGroup}"]) @mutation(operations: []) @authorization(
                filter: [
                    { where: { node: { createdBy: { id: "$jwt.sub" } } } },
                ]
            ) {
                id: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE]) @private
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE]) @private
                createdBy: ${User}! @relationship(type: "CREATED_ADMIN_GROUP", direction: IN) @settable(onCreate: true, onUpdate: false)
            }

            type ${User} @node(labels: ["${User}"]) @mutation(operations: []) @authorization(
                filter: [
                    { where: { node: { NOT: { blockedUsers_SOME: { to: { id: "$jwt.sub" } } } } } },
                ]
            ) {
                id: ID! @unique @settable(onCreate: true, onUpdate: false)
                createdAt: DateTime! @private
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE]) @private
                username: String! @unique
                blockedUsers: [${UserBlockedUser}!]! @relationship(type: "HAS_BLOCKED", direction: OUT)
                createdAdminGroups: [${AdminGroup}!]! @relationship(type: "CREATED_ADMIN_GROUP", direction: OUT)
            }
        
            type ${UserBlockedUser} @node(labels: ["${UserBlockedUser}"]) @query(read: false, aggregate: false) @mutation(operations: []) @authorization(
                filter: [
                    { where: { node: { from: { id: "$jwt.sub" } } } }
                ]
            ) {
                id: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE]) @private
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE]) @private
                from: ${User}! @relationship(type: "HAS_BLOCKED", direction: IN) @settable(onCreate: true, onUpdate: false)
                to: ${User}! @relationship(type: "IS_BLOCKING", direction: OUT) @settable(onCreate: true, onUpdate: false)
            }

            union PartyCreator = ${User} | ${AdminGroup}

            type ${Party} @node(labels: ["${Party}"]) @mutation(operations: []) @authorization(
                filter: [
                    { where: { node: { createdByConnection: { ${User}: { node: { id: "$jwt.sub" } } } } } },
                    { where: { node: { createdByConnection: { ${AdminGroup}: { node: { createdBy: { id: "$jwt.sub" } } } } } } },
                ]
            ){
                id: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE]) @private
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE]) @private
                createdBy: PartyCreator! @relationship(type: "CREATED_PARTY", direction: IN) @settable(onCreate: true, onUpdate: false)
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

    test("should return filtered results according to authorization rule", async () => {
        const query = `
        query Parties {
            ${Party.plural} {
              id
              createdBy {
                ... on ${User} {
                  username
                }
              }
            }
          }
        `;

        await testHelper.executeCypher(`
        CREATE (p:${Party} { id: "1" })<-[:CREATED_PARTY]-(u:${User} { id: "1", username: "arthur" });
        `);

        const token = createBearerToken(secret, { sub: "1" });
        const result = await testHelper.executeGraphQLWithToken(query, token);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [Party.plural]: [{ id: "1", createdBy: { username: "arthur" } }],
        });
    });
});
