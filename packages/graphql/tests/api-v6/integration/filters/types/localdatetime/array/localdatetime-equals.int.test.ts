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

describe("LocalDateTime array - Equals", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("localDateTime equals", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    title: String!
                    localDateTime: [LocalDateTime!]
                }
            `;
        const date1 = new Date("2024-09-17T11:49:48.322Z");
        const localdatetime1 = neo4jDriver.types.LocalDateTime.fromStandardDate(date1);

        const date2 = new Date("2025-09-17T11:49:48.322Z");
        const localdatetime2 = neo4jDriver.types.LocalDateTime.fromStandardDate(date2);

        const date3 = new Date("2026-09-17T11:49:48.322Z");
        const localdatetime3 = neo4jDriver.types.LocalDateTime.fromStandardDate(date3);
        
        const dateList1 = [localdatetime1, localdatetime3];
        const dateList2 = [localdatetime2];

        await testHelper.executeCypher(
            `
                CREATE (:${Movie.name} {title: "The Matrix", localDateTime: $dateList1})
                CREATE (:${Movie.name} {title: "The Matrix 2", localDateTime: $dateList2})
            `,
            { dateList1, dateList2 }
        );

        await testHelper.initNeo4jGraphQL({ typeDefs });
        const query = /* GraphQL */ `
            query movies($date1: LocalDateTime!, $date3: LocalDateTime!) {
              ${Movie.plural}(where: { edges: { node: { localDateTime: { equals: [$date1, $date3] }} }}) {
                  connection{
                      edges  {
                          node {
                              title
                              localDateTime
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
                                localDateTime: [dateList1[0]?.toString(), dateList1[1]?.toString()],
                            },
                        },
                    ],
                },
            },
        });
    });
});
