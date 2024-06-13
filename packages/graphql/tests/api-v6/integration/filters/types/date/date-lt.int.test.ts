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

describe("Date - LT", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Date LT", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    title: String!
                    date: Date
                }
            `;

        const date1 = new Date(1716904582368);
        const date2 = new Date(1736900000000);
        const neoDate1 = neo4jDriver.types.Date.fromStandardDate(date1);
        const neoDate2 = neo4jDriver.types.Date.fromStandardDate(date2);

        await testHelper.executeCypher(
            `
                CREATE (:${Movie.name} {title: "The Matrix", date: $neoDate1})
                CREATE (:${Movie.name} {title: "The Matrix 2", date: $neoDate2})
            `,
            { neoDate1, neoDate2 }
        );

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
                query {
                    ${Movie.plural}(where: { edges: { node: { date: { lt: "${neoDate2.toString()}" }} }}) {
                        connection{
                            edges  {
                                node {
                                    title
                                    date
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
                                date: neoDate1.toString(),
                            },
                        },
                    ],
                },
            },
        });
    });
});
