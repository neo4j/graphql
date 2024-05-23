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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Temporal types", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let TypeNode: UniqueType;
    beforeAll(async () => {
        TypeNode = testHelper.createUniqueType("TypeNode");

        const typeDefs = /* GraphQL */ `
            type ${TypeNode} @node {
                id: ID!
                dateTime: DateTime
                localDateTime: LocalDateTime
                duration: Duration
                time: Time
                localTime: LocalTime
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
     

        await testHelper.executeCypher(`
            CREATE (:${TypeNode} {
                id: "1",
                dateTime: datetime('2015-06-24T12:50:35.556+0100'),
                localDateTime: localDateTime('2003-09-14T12:00:00'),
                duration: duration('P1Y'),
                time: time('22:00:15.555'),
                localTime: localTime('12:50:35.556')
            })

            CREATE (:${TypeNode} {
                id: "2",
                dateTime: datetime('2011-06-24T12:50:35.556+0100'),
                localDateTime: localDateTime('2003-09-14T12:00:00'),
                duration: duration('P1Y'),
                time: time('22:00:15.555'),
                localTime: localTime('12:50:35.556')
            })

            CREATE (:${TypeNode} {
                id: "3",
                dateTime: datetime('2015-06-24T12:50:35.556+0100'),
                localDateTime: localDateTime('2003-09-14T12:00:00'),
                duration: duration('P2Y'),
                time: time('22:00:15.555'),
                localTime: localTime('12:50:35.556')
            })
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should be possible to filter temporal types", async () => {
        const query = /* GraphQL */ `
            query {
                ${TypeNode.plural}(
                    where: {
                        edges: {
                            node: {  
                                dateTime: { gt: "2012-06-24T12:50:35.556+0100" }
                                localDateTime: { lte: "2004-09-14T12:00:00" }
                                duration: { equals: "P1Y" }
                                time: { gte: "22:00:15.555" }
                                localTime: { lt: "12:55:35.556" }
                            }
                        }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [TypeNode.plural]: {
                connection: {
                    edges: [
                        {
                            node: { id: "1" },
                        },
                    ],
                },
            },
        });
    });
});
