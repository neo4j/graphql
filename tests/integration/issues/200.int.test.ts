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

describe("https://github.com/neo4j/graphql/issues/200", () => {
    let Category: UniqueType;
    const testHelper = new TestHelper();

    beforeAll(() => {
        Category = testHelper.createUniqueType("Category");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should successfully execute given mutation", async () => {
        const typeDefs = `
            type ${Category} {
                categoryId: ID! @id @unique
                name: String!
                description: String! @default(value: "")
                exampleImageLocations: [String!]
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const catOne = generate({ charset: "alphabetic" });
        const catTwo = generate({ charset: "alphabetic" });

        const query = `
            mutation($catOne: String!, $catTwo: String!, $exampleImageLocations: [String!]) {
                ${Category.operations.create}(
                  input: [
                    { name: $catOne}
                    { name: $catTwo, exampleImageLocations: $exampleImageLocations }
                  ]
                ) {
                  ${Category.plural} {
                    name
                    exampleImageLocations
                  }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { catOne, catTwo, exampleImageLocations: [] },
        });

        expect(gqlResult.errors).toBeFalsy();

        const cats = (gqlResult?.data as any)?.[Category.operations.create][Category.plural] as any[];

        const one = cats.find((x) => x.name === catOne);
        expect(one).toEqual({ name: catOne, exampleImageLocations: null });

        const two = cats.find((x) => x.name === catTwo);
        expect(two).toEqual({ name: catTwo, exampleImageLocations: [] });
    });
});
