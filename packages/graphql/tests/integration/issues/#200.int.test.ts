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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/200", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should successfully execute given mutation", async () => {
        const typeDefs = `
            type Category {
                categoryId: ID! @id
                name: String!
                description: String! @default(value: "")
                exampleImageLocations: [String!]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const catOne = generate({ charset: "alphabetic" });
        const catTwo = generate({ charset: "alphabetic" });

        const query = `
            mutation($catOne: String!, $catTwo: String!, $exampleImageLocations: [String!]) {
                createCategories(
                  input: [
                    { name: $catOne}
                    { name: $catTwo, exampleImageLocations: $exampleImageLocations }
                  ]
                ) {
                  categories {
                    name
                    exampleImageLocations
                  }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            variableValues: { catOne, catTwo, exampleImageLocations: [] },
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeFalsy();

        const cats = gqlResult?.data?.createCategories.categories as any[];

        const one = cats.find((x) => x.name === catOne);
        expect(one).toEqual({ name: catOne, exampleImageLocations: null });

        const two = cats.find((x) => x.name === catTwo);
        expect(two).toEqual({ name: catTwo, exampleImageLocations: [] });
    });
});
