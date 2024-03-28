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

describe("Aliasing", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let id: string;
    let budget: number;
    let boxOffice: number;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = `
        type ${Movie} {
            id: ID!
            budget: Int!
            boxOffice: Float!
        }
        `;

        id = generate({ readable: false });
        budget = 63;
        boxOffice = 465.3;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (movie:${Movie})
                    SET movie += $properties
                `,
            {
                properties: {
                    id,
                    boxOffice,
                    budget,
                },
            }
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should correctly alias an ID field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id: $id }) {
                    aliased: id
                    budget
                    boxOffice
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            aliased: id,
            budget,
            boxOffice,
        });
    });

    test("should correctly alias an Int field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id: $id }) {
                    id
                    aliased: budget
                    boxOffice
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            id,
            aliased: budget,
            boxOffice,
        });
    });

    test("should correctly alias an Float field", async () => {
        const query = `
            query ($id: ID!) {
                ${Movie.plural}(where: { id: $id }) {
                    id
                    budget
                    aliased: boxOffice
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult?.data as any)[Movie.plural][0]).toEqual({
            id,
            budget,
            aliased: boxOffice,
        });
    });
});
