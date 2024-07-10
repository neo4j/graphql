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

describe("DateTime - Equals", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("datetime equals to ISO string", async () => {
        const typeDefs = /* GraphQL */ `
                type ${Movie.name} @node {
                    title: String!
                    datetime: DateTime
                }
            `;

        const date1 = new Date(1716904582368);
        const date2 = new Date(1716900000000);
        const datetime1 = neo4jDriver.types.DateTime.fromStandardDate(date1);
        const datetime2 = neo4jDriver.types.DateTime.fromStandardDate(date2);

        await testHelper.executeCypher(
            `
                   CREATE (:${Movie.name} {title: "The Matrix", datetime: $datetime1})
                   CREATE (:${Movie.name} {title: "The Matrix 2", datetime: $datetime2})
               `,
            { datetime1, datetime2 }
        );

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
                query {
                    ${Movie.plural}(where: { node: { datetime: { equals: "${date1.toISOString()}" }}}) {
                        connection{
                            edges  {
                                node {
                                    title
                                    datetime
                                }
                            }
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Movie.plural]).toEqual({
            connection: {
                edges: [
                    {
                        node: {
                            title: "The Matrix",
                            datetime: date1.toISOString(),
                        },
                    },
                ],
            },
        });
    });
});
