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
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("Default values", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should allow default value on custom @cypher node field", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
              field(skip: Int = 100): Int
                @cypher(
                    statement: """
                    return $skip as s
                    """,
                    columnName: "s"
                )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            {
                ${Movie.plural}(where: {id: "${id}"}){
                    id
                    field
                }
            }
        `;

        await testHelper.executeCypher(`
                CREATE (:${Movie} {id: "${id}"})
            `);

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.plural][0]).toEqual({
            id,
            field: 100,
        });
    });

    test("should allow default value on custom @cypher custom resolver field", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID
            }

            type Query {
                field(skip: Int = 100): Int
                @cypher(
                    statement: """
                    return $skip as s
                    """,
                    columnName: "s"
                )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const create = `
            {
                field
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).field).toBe(100);
    });
});
