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

describe("https://github.com/neo4j/graphql/issues/2574", () => {
    const testHelper = new TestHelper();

    let A: UniqueType;
    let B: UniqueType;
    let D: UniqueType;

    beforeEach(async () => {
        A = testHelper.createUniqueType("A");
        B = testHelper.createUniqueType("B");
        D = testHelper.createUniqueType("D");

        const typeDefs = `
            type ${A} {
                uuid: ID! @id @unique
                child: ${D}! @relationship(type: "HAS_PARENT", direction: IN)
            }

            type ${B} {
                uuid: ID! @id @unique
                child: ${D}! @relationship(type: "HAS_PARENT", direction: IN)
            }

            union C = ${A} | ${B}

            type ${D} {
                uuid: ID! @id @unique
                test: String!
                parent: C! @relationship(type: "HAS_PARENT", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create birectional union relationship without error", async () => {
        const query = `
            mutation Mutation($input: [${A}CreateInput!]!) {
                ${A.operations.create}(input: $input) {
                    ${A.plural} {
                        child {
                            test
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query, {
            variableValues: {
                input: {
                    child: {
                        create: {
                            node: {
                                test: "bla",
                            },
                        },
                    },
                },
            },
        });
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [A.operations.create]: {
                [A.plural]: [
                    {
                        child: {
                            test: "bla",
                        },
                    },
                ],
            },
        });
    });
});
