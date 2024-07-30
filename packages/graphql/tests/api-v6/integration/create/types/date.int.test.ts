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
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Create Nodes with Date fields", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
        type ${Movie.name} @node {
            date: Date
        }
    `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should be able to create nodes with date fields", async () => {
        const date1 = new Date(1716904582368);
        const date2 = new Date(1736900000000);
        const neoDate1 = neo4jDriver.types.Date.fromStandardDate(date1);
        const neoDate2 = neo4jDriver.types.Date.fromStandardDate(date2);

        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [
                        { node: { date: "${neoDate1.toString()}" } }
                        { node: { date: "${neoDate2.toString()}" } }
                    ]) {
                    ${Movie.plural} {
                        date
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: expect.toIncludeSameMembers([
                    { date: neoDate1.toString() },
                    { date: neoDate2.toString() },
                ]),
            },
        });
    });
});
