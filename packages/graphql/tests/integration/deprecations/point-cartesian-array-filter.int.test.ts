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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("[CartesianPoint] - deprecated filters", () => {
    const testHelper = new TestHelper();
    let Part: UniqueType;

    beforeEach(async () => {
        Part = testHelper.createUniqueType("Part");
        const typeDefs = /* GraphQL */ `
            type ${Part} @node {
                id: String!
                locations: [CartesianPoint!]!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("enables query of a node with multiple cartesian points", async () => {
        const id = "5ba92bc4-95e7-4361-857c-60edcd771391";
        const locations = [...new Array(8)].map(() => ({
            x: 0.02772025833837688,
            y: 0.07264417805708945,
        }));

        await testHelper.executeCypher(
            `
            CALL {
                CREATE (r:${Part})
                SET r.id = $id
                SET r.locations = [p in $locations | point(p)]
                RETURN r
            }

            RETURN r { .id, .locations } AS r
        `,
            { id, locations }
        );

        const partsQuery = /* GraphQL */ `
            query Parts($id: String!) {
                ${Part.plural}(where: { id_EQ: $id }) {
                    id
                    locations {
                        y
                        x
                        z
                        crs
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(partsQuery, { variableValues: { id } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.plural][0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, z: null, crs: "cartesian" })),
        });
    });

    test("enables query of a node with multiple cartesian-3d points", async () => {
        const id = "052322ec-95e5-4b88-8a90-9f0c1df17ee3";
        const locations = [...new Array(8)].map(() => ({
            x: 0.8367510938551277,
            y: 0.7110547178890556,
            z: 0.9648887133225799,
        }));

        await testHelper.executeCypher(
            `
            CALL {
                CREATE (r:${Part})
                SET r.id = $id
                SET r.locations = [p in $locations | point(p)]
                RETURN r
            }

            RETURN r { .id, .locations } AS r
        `,
            { id, locations }
        );

        const partsQuery = /* GraphQL */ `
            query Parts($id: String!) {
                ${Part.plural}(where: { id_EQ: $id }) {
                    id
                    locations {
                        y
                        x
                        z
                        crs
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(partsQuery, { variableValues: { id } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.plural][0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, crs: "cartesian-3d" })),
        });
    });
});
