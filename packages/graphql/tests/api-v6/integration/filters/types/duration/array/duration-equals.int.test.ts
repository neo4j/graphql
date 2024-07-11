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

import { Duration } from "neo4j-driver";
import type { UniqueType } from "../../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../../utils/tests-helper";

describe("Duration array - Equals", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("duration Equals", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    title: String!
                    duration: [Duration!]
                }
            `;

        const duration1Args = { months: 10, days: 10, seconds: 10, nanoseconds: 10 };
        const duration1 = new Duration(
            duration1Args.months,
            duration1Args.days,
            duration1Args.seconds,
            duration1Args.nanoseconds
        );
        const duration2Args = { months: 4, days: 4, seconds: 4, nanoseconds: 4 };
        const duration2 = new Duration(
            duration2Args.months,
            duration2Args.days,
            duration2Args.seconds,
            duration2Args.nanoseconds
        );

        const duration3Args = { months: 4, days: 4, seconds: 4, nanoseconds: 4 };
        const duration3 = new Duration(
            duration3Args.months,
            duration3Args.days,
            duration3Args.seconds,
            duration3Args.nanoseconds
        );

        const dateList1 = [duration1, duration3];

        const dateList2 = [duration2];

        await testHelper.executeCypher(
            `
                CREATE (:${Movie.name} {title: "The Matrix", duration: $dateList1})
                CREATE (:${Movie.name} {title: "The Matrix 2", duration: $dateList2})
            `,
            { dateList1, dateList2 }
        );

        await testHelper.initNeo4jGraphQL({ typeDefs });
        const query = /* GraphQL */ `
            query movies($date1: Duration!, $date3: Duration!) {
              ${Movie.plural}(where: { node: { duration: { equals: [$date1, $date3] }} }) {
                  connection{
                      edges  {
                          node {
                              title
                              duration
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
                                duration: [dateList1[0]?.toString(), dateList1[1]?.toString()],
                            },
                        },
                    ],
                },
            },
        });
    });
});
