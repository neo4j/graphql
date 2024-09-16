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
import { TestHelper } from "../../../utils/tests-helper";

describe("Aggregate -> count", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should count nodes", async () => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${randomType.name} {id: randomUUID()})
                    CREATE (:${randomType.name} {id: randomUUID()})
                `
        );

        const query = `
                {
                    ${randomType.operations.aggregate}{
                      count
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[randomType.operations.aggregate].count).toBe(2);
    });

    test("should count nodes with where and or predicate", async () => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        await testHelper.executeCypher(
            `
                CREATE (:${randomType.name} {id: $id1})
                CREATE (:${randomType.name} {id: $id2})
            `,
            { id1, id2 }
        );

        const query = `
                {
                  ${randomType.operations.aggregate}(where: { OR: [{id: "${id1}"}, {id: "${id2}"}] }){
                    count
                  }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[randomType.operations.aggregate].count).toBe(2);
    });
});
