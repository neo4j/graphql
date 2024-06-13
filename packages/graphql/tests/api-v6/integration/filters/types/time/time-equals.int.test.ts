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

import { Time } from "neo4j-driver";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("Time - Equals", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Time Equals", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    title: String!
                    time: Time
                }
            `;

        const date1 = new Date("2024-02-17T11:49:48.322Z");
        const time1 = Time.fromStandardDate(date1);

        const date2 = new Date("2025-02-17T12:49:48.322Z");
        const time2 = Time.fromStandardDate(date2);

        await testHelper.executeCypher(
            `
                   CREATE (:${Movie.name} {title: "The Matrix", time: $time1})
                   CREATE (:${Movie.name} {title: "The Matrix 2", time: $time2})
               `,
            { time1, time2 }
        );

        await testHelper.initNeo4jGraphQL({ typeDefs });
        const query = /* GraphQL */ `
                query {
                    ${Movie.plural}(where: { edges: { node: { time: { equals: "${time1.toString()}" }} }}) {
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

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                title: "The Matrix",
                                time: time1.toString(),
                            },
                        },
                    ],
                },
            },
        });
    });
});
