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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/235", () => {
    const testHelper = new TestHelper();
    let A: UniqueType;
    let B: UniqueType;
    let C: UniqueType;

    beforeAll(() => {
        A = testHelper.createUniqueType("A");
        B = testHelper.createUniqueType("B");
        C = testHelper.createUniqueType("C");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should create the correct number of nodes following multiple connect", async () => {
        const typeDefs = /* GraphQL */ `
            type ${A} {
                ID: ID! @id @unique
                name: String
                rel_b: [${B}!]! @relationship(type: "REL_B", direction: OUT)
                rel_c: [${C}!]! @relationship(type: "REL_C", direction: OUT)
            }
        
            type ${B} {
                ID: ID! @id @unique
                name: String
            }

            type ${C} {
                ID: ID! @id @unique
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const b1 = generate({ charset: "alphabetic" });
        const b2 = generate({ charset: "alphabetic" });

        const a = generate({ charset: "alphabetic" });

        const c = generate({ charset: "alphabetic" });

        const createBs = `
        mutation {
            ${B.operations.create}(input: [{ name: "${b1}" }, { name: "${b2}" }]) {
                ${B.plural} {
                    name
                }
            }
        }
        `;

        const createAs = `
            mutation CreateAS($a: String!, $b1: String!, $b2: String!, $c: String!) {
                ${A.operations.create}(
                    input: [
                        {
                            name: $a
                            rel_b: { connect: { where: { node: { name_IN: [$b1, $b2] } } } }
                            rel_c: { create: { node: { name: $c } } }
                        }
                    ]
                ) {
                    ${A.plural} {
                        name
                        rel_b {
                            name
                        }
                        rel_c {
                            name
                        }
                    }
                }
            }
         `;

        const as = `
            query As($a: String) {
                ${A.plural}(where: { name: $a }) {
                    name
                    rel_b {
                        name
                    }
                    rel_c {
                        name
                        ID
                    }
                }
            }
        `;

        const createBsResult = await testHelper.executeGraphQL(createBs, {
            variableValues: { b1, b2 },
        });

        expect(createBsResult.errors).toBeFalsy();
        expect((createBsResult.data as any)[B.operations.create][B.plural]).toEqual([{ name: b1 }, { name: b2 }]);

        const createAsResult = await testHelper.executeGraphQL(createAs, {
            variableValues: { a, b1, b2, c },
        });

        expect(createAsResult.errors).toBeFalsy();
        expect((createAsResult.data as any)?.[A.operations.create][A.plural]).toHaveLength(1);
        expect((createAsResult.data as any)?.[A.operations.create][A.plural][0].name).toEqual(a);
        expect((createAsResult.data as any)?.[A.operations.create][A.plural][0].rel_b).toHaveLength(2);
        expect((createAsResult.data as any)?.[A.operations.create][A.plural][0].rel_b).toContainEqual({ name: b1 });
        expect((createAsResult.data as any)?.[A.operations.create][A.plural][0].rel_b).toContainEqual({ name: b2 });
        expect((createAsResult.data as any)?.[A.operations.create][A.plural][0].rel_c).toEqual([{ name: c }]);

        const asResult = await testHelper.executeGraphQL(as, {
            variableValues: { a },
        });

        expect(asResult.errors).toBeFalsy();
        expect((asResult.data as any)[A.plural]).toHaveLength(1);
        expect((asResult.data as any)[A.plural][0].name).toEqual(a);
        expect((asResult.data as any)[A.plural][0].rel_b).toHaveLength(2);
        expect((asResult.data as any)[A.plural][0].rel_b).toContainEqual({ name: b1 });
        expect((asResult.data as any)[A.plural][0].rel_b).toContainEqual({ name: b2 });
        expect((asResult.data as any)[A.plural][0].rel_c).toHaveLength(1);
        expect((asResult.data as any)[A.plural][0].rel_c[0].name).toEqual(c);
    });
});
