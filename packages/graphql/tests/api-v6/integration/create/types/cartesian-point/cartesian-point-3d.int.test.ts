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

describe("Create Nodes with CartesianPoint 3d", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Location: UniqueType;

    const London = { x: -14221.955504767046, y: 6711533.711877272, z: 0 } as const;
    const Rome = { x: 1391088.9885668862, y: 5146427.7652232265, z: 0 } as const;

    beforeEach(async () => {
        Location = testHelper.createUniqueType("Location");

        const typeDefs = /* GraphQL */ `
            type ${Location} @node {
                id: ID!
                value: CartesianPoint!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create nodes with wgs-84-3d point fields", async () => {
        const mutation = /* GraphQL */ `
        mutation {
            ${Location.operations.create}(input: [
                    { node: { id: "1", value: { x: ${London.x}, y: ${London.y}, z: ${London.z} } } }
                    { node: { id: "2", value: { x: ${Rome.x}, y: ${Rome.y}, z: ${Rome.z} } } }
                ]) 
                {
                    ${Location.plural} {
                        id
                        value {
                            x
                            y
                            z
                            crs
                            srid
                        }
                    }
                }
               
            
        }
    `;

        const mutationResult = await testHelper.executeGraphQL(mutation);
        expect(mutationResult.errors).toBeFalsy();
        expect(mutationResult.data).toEqual({
            [Location.operations.create]: {
                [Location.plural]: expect.toIncludeSameMembers([
                    {
                        id: "1",
                        value: {
                            y: London.y,
                            x: London.x,
                            z: London.z,
                            crs: "cartesian-3d",
                            srid: 9157,
                        },
                    },
                    {
                        id: "2",
                        value: {
                            y: Rome.y,
                            x: Rome.x,
                            z: Rome.z,
                            crs: "cartesian-3d",
                            srid: 9157,
                        },
                    },
                ]),
            },
        });
    });
});
