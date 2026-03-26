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

describe("https://github.com/neo4j/graphql/issues/7146", () => {
    let Product: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        Product = testHelper.createUniqueType("Product");

        const typeDefs = /* GraphQL */ `
            type ${Product} @node {
                id: String
                status: Status! @populatedBy(callback: "StatusCallback", operations: [CREATE, UPDATE])
                statuses: [Status!] @populatedBy(callback: "StatusesCallback", operations: [CREATE, UPDATE])
            }

            enum Status {
                ACTIVE
                DISABLED
                
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: { StatusCallback: () => "ACTIVE", StatusesCallback: () => ["ACTIVE", "DISABLED"] },
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should populate enum field correctly", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Product.operations.create}(input: [{id: "123"}]) {
                    ${Product.plural} {
                        id
                        status
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[Product.operations.create]).toEqual({
            [Product.plural]: [
                {
                    id: "123",
                    status: "ACTIVE",
                },
            ],
        });
    });
    test("should populate enum list field correctly", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Product.operations.create}(input: [{id: "123"}]) {
                    ${Product.plural} {
                        id
                        statuses
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[Product.operations.create]).toEqual({
            [Product.plural]: [
                {
                    id: "123",
                    statuses: ["ACTIVE", "DISABLED"],
                },
            ],
        });
    });
});
