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
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("Create Nodes with Temporal array fields", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                date: [Date!]!
                dateTime: [DateTime!]!
                localTime: [LocalTime!]!
                localDateTime: [LocalDateTime!]!
                time: [Time!]!
                duration: [Duration!]!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should be able to create nodes with Temporal fields", async () => {
        const date1 = new Date(1716904582368);
        const date2 = new Date(1736900000000);
        // DATETIME
        const neoDateTime1 = date1.toISOString();
        const neoDateTime2 = date1.toISOString();

        // DATE
        const neoDate1 = neo4jDriver.types.Date.fromStandardDate(date1);
        const neoDate2 = neo4jDriver.types.Date.fromStandardDate(date2);

        // TIME
        const neoTime1 = neo4jDriver.Time.fromStandardDate(date1);
        const neoTime2 = neo4jDriver.Time.fromStandardDate(date2);

        // LOCALTIME
        const neoLocalTime1 = neo4jDriver.LocalTime.fromStandardDate(date1);
        const neoLocalTime2 = neo4jDriver.LocalTime.fromStandardDate(date2);

        // LOCALDATETIME
        const neoLocalDateTime1 = neo4jDriver.LocalDateTime.fromStandardDate(date1);
        const neoLocalDateTime2 = neo4jDriver.LocalDateTime.fromStandardDate(date2);

        // Duration
        const duration1 = new neo4jDriver.Duration(1, 2, 3, 4);
        const duration2 = new neo4jDriver.Duration(5, 6, 7, 8);

        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input: [
                    { 
                        node: {
                            date: ["${neoDate1.toString()}", "${neoDate1.toString()}"],
                            dateTime: ["${neoDateTime1.toString()}", "${neoDateTime1.toString()}"]
                            localTime: ["${neoLocalTime1.toString()}", "${neoLocalTime1.toString()}"]
                            localDateTime: ["${neoLocalDateTime1.toString()}", "${neoLocalDateTime1.toString()}"]
                            time: ["${neoTime1.toString()}", "${neoTime1.toString()}"],
                            duration: ["${duration1.toString()}", "${duration1.toString()}"]
                        }
                    }
                    { 
                        node: {
                            date: ["${neoDate2.toString()}", "${neoDate2.toString()}"],
                            dateTime: ["${neoDateTime2.toString()}", "${neoDateTime2.toString()}"]
                            localTime: ["${neoLocalTime2.toString()}", "${neoLocalTime2.toString()}"]
                            localDateTime: ["${neoLocalDateTime2.toString()}", "${neoLocalDateTime2.toString()}"]
                            time: ["${neoTime2.toString()}", "${neoTime2.toString()}"],
                            duration: ["${duration2.toString()}", "${duration2.toString()}"]
                        }
                    }
                    ]) {
                        ${Movie.plural} {
                            date
                            dateTime
                            localTime
                            localDateTime
                            time
                            duration
                        }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: expect.toIncludeSameMembers([
                    {
                        date: [neoDate1.toString(), neoDate1.toString()],
                        dateTime: [neoDateTime1.toString(), neoDateTime1.toString()],
                        localTime: [neoLocalTime1.toString(), neoLocalTime1.toString()],
                        localDateTime: [neoLocalDateTime1.toString(), neoLocalDateTime1.toString()],
                        time: [neoTime1.toString(), neoTime1.toString()],
                        duration: [duration1.toString(), duration1.toString()],
                    },
                    {
                        date: [neoDate2.toString(), neoDate2.toString()],
                        dateTime: [neoDateTime2.toString(), neoDateTime2.toString()],
                        localTime: [neoLocalTime2.toString(), neoLocalTime2.toString()],
                        localDateTime: [neoLocalDateTime2.toString(), neoLocalDateTime2.toString()],
                        time: [neoTime2.toString(), neoTime2.toString()],
                        duration: [duration2.toString(), duration2.toString()],
                    },
                ]),
            },
        });
    });
});
