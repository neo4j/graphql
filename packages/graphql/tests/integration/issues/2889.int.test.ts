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

describe("https://github.com/neo4j/graphql/issues/2889", () => {
    const testHelper = new TestHelper();

    let MyEnumHolder: UniqueType;

    beforeEach(async () => {
        MyEnumHolder = testHelper.createUniqueType("MyEnumHolder");

        const typeDefs = `
            enum MyEnum {
                FIRST
                SECOND
            }

            type ${MyEnumHolder} {
                myEnums: [MyEnum!]!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be able to create node with list of enums", async () => {
        const query = `
            mutation {
                ${MyEnumHolder.operations.create}(input: [{ myEnums: [FIRST, SECOND] }]) {
                    ${MyEnumHolder.plural} {
                        myEnums
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect((result.data?.[MyEnumHolder.operations.create] as any)[MyEnumHolder.plural]).toEqual([
            { myEnums: ["FIRST", "SECOND"] },
        ]);
    });
});
