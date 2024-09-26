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

import neo4jDriver from "neo4j-driver";
import { TestHelper } from "../../utils/tests-helper";

describe("Implicit _EQ filtering", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test.each([
        ["String", ["Matrix", "Matrix 2", "Matrix 3"]],
        ["ID", ["z121039", "a10239", "b12389"]],
    ] as const)("the deprecated implicit _EQ should correctly apply filters for string types", async (type, values) => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
                type ${randomType.name} @node {
                    property: ${type}
                }
            `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const value = values[0];
        const otherValue1 = values[1];
        const otherValue2 = values[2];

        await testHelper.executeCypher(
            `
                CREATE (:${randomType.name} {property: $value })
                CREATE (:${randomType.name} {property: $otherValue1 })
                CREATE (:${randomType.name} {property: $otherValue2 })
            `,
            { value, otherValue1, otherValue2 }
        );

        const query = /* GraphQL */ `
                {
                    ${randomType.plural}(where: { property: "${value}" }) {
                        property
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
    });

    test.each([
        ["Int", [1999999, 1000000, 2999999]],
        ["Float", [1.19, 1.2, 2.3]],
    ] as const)(
        "the deprecated implicit _EQ should correctly apply filters for numerical types",
        async (type, values) => {
            const randomType = testHelper.createUniqueType("Movie");

            const typeDefs = /* GraphQL */ `
                type ${randomType.name} @node {
                    property: ${type}
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const value = values[0];
            const otherValue1 = values[1];
            const otherValue2 = values[2];

            await testHelper.executeCypher(
                `
                    CREATE (:${randomType.name} {property: $value })
                    CREATE (:${randomType.name} {property: $otherValue1 })
                    CREATE (:${randomType.name} {property: $otherValue2 })
                `,
                { value, otherValue1, otherValue2 }
            );

            const query = /* GraphQL */ `
                {
                    ${randomType.plural}(where: { property: ${value} }) {
                        property
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
            expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value);
        }
    );

    test("the deprecated implicit _EQ should correctly apply filters for Date type", async () => {
        const randomType = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
                type ${randomType.name} @node {
                    property: Date
                }
            `;

        const date1 = new Date(1716904582368);
        const date2 = new Date(1736900000000);
        const neoDate1 = neo4jDriver.types.Date.fromStandardDate(date1);
        const neoDate2 = neo4jDriver.types.Date.fromStandardDate(date2);

        await testHelper.executeCypher(
            `
                   CREATE (:${randomType.name} {property: $datetime1})
                   CREATE (:${randomType.name} {property: $datetime2})
               `,
            { datetime1: neoDate1, datetime2: neoDate2 }
        );

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            {
                ${randomType.plural}(where: { property: "${neoDate1.toString()}"  }) {
                    property
                }
            }
        `;
        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(neoDate1.toString());
    });

    test("the deprecated implicit _EQ should correctly apply filters for BigInt type", async () => {
        const [type, values] = ["BigInt", [1999999, 1000000, 2999999]] as const;
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
                type ${randomType.name} @node {
                    property: ${type}
                }
            `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const value = values[0];
        const otherValue1 = values[1];
        const otherValue2 = values[2];

        await testHelper.executeCypher(
            `
                    CREATE (:${randomType.name} {property: $value })
                    CREATE (:${randomType.name} {property: $otherValue1 })
                    CREATE (:${randomType.name} {property: $otherValue2 })
                `,
            { value, otherValue1, otherValue2 }
        );

        const query = /* GraphQL */ `
                {
                    ${randomType.plural}(where: { property: "${value}" }) {
                        property
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[randomType.plural]).toHaveLength(1);
        expect((gqlResult.data as any)[randomType.plural][0].property).toEqual(value.toString());
    });
});
