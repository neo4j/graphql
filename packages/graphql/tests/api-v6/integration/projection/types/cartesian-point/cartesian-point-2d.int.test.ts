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

import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("CartesianPoint 2d", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Location: UniqueType;
    const London = { x: -14221.955504767046, y: 6711533.711877272 };
    const Rome = { x: 1391088.9885668862, y: 5146427.7652232265 };

    beforeEach(async () => {
        Location = testHelper.createUniqueType("Location");

        const typeDefs = /* GraphQL */ `
            type ${Location} @node {
                id: ID!
                value: CartesianPoint!
            }
        `;
        await testHelper.executeCypher(
            `
                    CREATE (:${Location} { id: "1", value: point($London)})
                    CREATE (:${Location} { id: "2", value: point($Rome)})
                `,
            { London, Rome }
        );
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });
    // srid commented as  results of https://github.com/neo4j/graphql/issues/5223
    test("wgs-84-2d point", async () => {
        const query = /* GraphQL */ `
            query {
                ${Location.plural} {
                    connection {
                        edges {
                            node {
                                id
                                value {
                                    y
                                    x
                                    z
                                    crs
                                   # srid
                                }
                            }
                        }
                    }
                   
                }
            }
        `;

        const equalsResult = await testHelper.executeGraphQL(query);

        expect(equalsResult.errors).toBeFalsy();
        expect(equalsResult.data).toEqual({
            [Location.plural]: {
                connection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                id: "1",
                                value: {
                                    y: London.y,
                                    x: London.x,
                                    z: null,
                                    crs: "cartesian",
                                    // srid: 7203,
                                },
                            },
                        },
                        {
                            node: {
                                id: "2",
                                value: {
                                    y: Rome.y,
                                    x: Rome.x,
                                    z: null,
                                    crs: "cartesian",
                                    //srid: 7203,
                                },
                            },
                        },
                    ]),
                },
            },
        });
    });
});
