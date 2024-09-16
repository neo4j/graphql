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

describe("https://github.com/neo4j/graphql/issues/2388", () => {
    const testHelper = new TestHelper();
    let PartAddress: UniqueType;
    let PartUsage: UniqueType;
    let Part: UniqueType;
    const secret = "secret";

    beforeEach(async () => {
        PartAddress = testHelper.createUniqueType("PartAddress");
        PartUsage = testHelper.createUniqueType("PartUsage");
        Part = testHelper.createUniqueType("Part");

        const typeDefs = `
        type JWTPayload @jwt {
            roles: [String!]!
        }

        type ${PartAddress}
            @authorization(validate: [
                { operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { jwt: { roles_INCLUDES: "upstream" } } }
                { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
            ])
        {
            id: ID! @id @unique
        }

        type ${PartUsage}
            @authorization(validate: [
                { operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { jwt: { roles_INCLUDES: "upstream" } } }
                { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
            ])
        {
            partAddress: ${PartAddress}
            @relationship(type: "BELONGS_TO", direction: OUT)
        }

        type ${Part}
            @authorization(validate: [
                { operations: [READ, CREATE, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { jwt: { roles_INCLUDES: "upstream" } } }
                { operations: [READ], where: { jwt: { roles_INCLUDES: "downstream" } } }
            ])
        {
            partUsages: [${PartUsage}!]!
            @relationship(type: "USAGE_OF", direction: IN)
        }
        `;

        // Initialise data
        await testHelper.executeCypher(`
            CREATE (p:${Part})<-[uo:USAGE_OF]-(pu:${PartUsage})-[bt:BELONGS_TO]->(pa:${PartAddress})
            SET pa.id = "123"
        `);

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

    test("should returns the correct count without errors", async () => {
        const query = `
        query PartByNumber {
            ${Part.plural} {
                partUsagesAggregate(where: { partAddress: { id: "123" } }) {
                    count
                }
            }
          }
        `;

        const token = createBearerToken(secret, { roles: ["upstream", "downstream"] });

        const result = await testHelper.executeGraphQLWithToken(query, token);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Part.plural]: [
                {
                    partUsagesAggregate: {
                        count: 1,
                    },
                },
            ],
        });
    });
});
