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
import type { UniqueType } from "../../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../../utils/tests-helper";

describe("Time array - Equals", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("time Equals", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    title: String!
                    time: [Time!]
                }
            `;

        const date1 = new Date("2024-02-17T11:49:48.322Z");
        const date2 = new Date("2024-02-17T14:49:48.322Z");
        const date3 = new Date("2025-02-17T12:49:48.322Z");
        const dateList1 = [
            neo4jDriver.types.Time.fromStandardDate(date1),
            neo4jDriver.types.Time.fromStandardDate(date3),
        ];

        const dateList2 = [neo4jDriver.types.Time.fromStandardDate(date2)];

        await testHelper.executeCypher(
            `
                CREATE (:${Movie.name} {title: "The Matrix", time: $dateList1})
                CREATE (:${Movie.name} {title: "The Matrix 2", time: $dateList2})
            `,
            { dateList1, dateList2 }
        );

        await testHelper.initNeo4jGraphQL({ typeDefs });
        const query = /* GraphQL */ `
            query movies($date1: Time!, $date3: Time!) {
              ${Movie.plural}(where: { edges: { node: { time: { equals: [$date1, $date3] }} }}) {
                  connection{
                      edges  {
                          node {
                              title
                              time
                          }
                      }
                  }
              }
          }
      `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                date1: dateList1[0]?.toString(),
                date3: dateList1[1]?.toString(),
            },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                title: "The Matrix",
                                time: [dateList1[0]?.toString(), dateList1[1]?.toString()],
                            },
                        },
                    ],
                },
            },
        });
    });
});
