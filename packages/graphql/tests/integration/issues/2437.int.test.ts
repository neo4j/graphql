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

describe("https://github.com/neo4j/graphql/issues/2437", () => {
    const testHelper = new TestHelper();

    let Agent: UniqueType;
    let Valuation: UniqueType;

    beforeEach(async () => {
        Agent = testHelper.createUniqueType("Agent");
        Valuation = testHelper.createUniqueType("Valuation");

        const typeDefs = `
            type JWT @jwt {
                roles: [String!]!
            }

            type ${Agent} @mutation(operations: [CREATE, UPDATE]) {
                uuid: ID! @id @unique
                archivedAt: DateTime

                valuations: [${Valuation}!]! @relationship(type: "IS_VALUATION_AGENT", direction: OUT)
            }

            extend type ${Agent}
                @authorization(validate: [{ operations: [CREATE], where: { jwt: { roles_INCLUDES: "Admin" } } }], filter: [{ where: { node: { archivedAt: null } } }])

            type ${Valuation} @mutation(operations: [CREATE, UPDATE]) {
                uuid: ID! @id @unique
                archivedAt: DateTime

                agent: ${Agent}! @relationship(type: "IS_VALUATION_AGENT", direction: IN)
            }

            extend type ${Valuation} @authorization(filter: [{ where: { node: { archivedAt: null } } }])
        `;

        await testHelper.executeCypher(`
        CREATE(a:${Agent} {uuid: "a1"})
        CREATE(:${Valuation} {uuid: "v1"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v2"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v3"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v4"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v5"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v6"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v7"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v8"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v9"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v10"})<-[:IS_VALUATION_AGENT]-(a)
        CREATE(:${Valuation} {uuid: "v11"})<-[:IS_VALUATION_AGENT]-(a)
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return only the first elements", async () => {
        const query = `
            query {
                ${Agent.plural}(where: { uuid: "a1" }) {
                    uuid
                    valuationsConnection(first: 10) {
                        edges {
                            node {
                                uuid
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"));

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Agent.plural]: [
                {
                    uuid: "a1",
                    valuationsConnection: {
                        edges: expect.toBeArrayOfSize(10),
                        pageInfo: {
                            hasNextPage: true,
                        },
                    },
                },
            ],
        });
    });
});
