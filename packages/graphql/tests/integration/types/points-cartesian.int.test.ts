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

import { int } from "neo4j-driver";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("[CartesianPoint]", () => {
    const testHelper = new TestHelper();
    let Part: UniqueType;

    beforeEach(async () => {
        Part = testHelper.createUniqueType("Part");
        const typeDefs = /* GraphQL */ `
            type ${Part} {
                id: String!
                locations: [CartesianPoint!]!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("enables creation of a node with multiple cartesian points", async () => {
        const id = "9447ac23-6f8b-4ee3-88f1-0428c9e5a4af";
        const locations = [...new Array(2)].map(() => ({
            x: 0.08219389710575342,
            y: 0.09543730691075325,
        }));

        const create = /* GraphQL */ `
            mutation CreateParts($id: String!, $locations: [CartesianPointInput!]!) {
                ${Part.operations.create}(input: [{ id: $id, locations: $locations }]) {
                    ${Part.plural} {
                        id
                        locations {
                            y
                            x
                            z
                            crs
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create, { variableValues: { id, locations } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.operations.create][Part.plural][0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, z: null, crs: "cartesian" })),
        });

        const result = await testHelper.executeCypher(`
                MATCH (r:${Part} {id: "${id}"})
                RETURN r { .id, .locations} as r
            `);

        expect(
            result.records[0]
                ?.toObject()
                .r.locations.map((location) => {
                    expect(location.srid).toEqual(int(7203));
                    return {
                        x: location.x,
                        y: location.y,
                    };
                })
                .sort()
        ).toEqual(locations.sort());
    });

    test("enables creation of a node with multiple cartesian-3d points", async () => {
        const id = "fceabcc2-3086-48a5-9297-ea17e2dd9d4b";
        const locations = [...new Array(8)].map(() => ({
            x: 0.0814846286084503,
            y: 0.9454853804782033,
            z: 0.051746641751378775,
        }));

        const create = /* GraphQL */ `
            mutation CreateParts($id: String!, $locations: [CartesianPointInput!]!) {
                ${Part.operations.create}(input: [{ id: $id, locations: $locations }]) {
                    ${Part.plural} {
                        id
                        locations {
                            y
                            x
                            z
                            crs
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create, { variableValues: { id, locations } });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.operations.create][Part.plural][0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, crs: "cartesian-3d" })),
        });

        const result = await testHelper.executeCypher(`
                MATCH (r:${Part} {id: "${id}"})
                RETURN r { .id, .locations} as r
            `);

        expect(
            result.records[0]
                ?.toObject()
                .r.locations.map((location) => {
                    expect(location.srid).toEqual(int(9157));
                    return {
                        x: location.x,
                        y: location.y,
                        z: location.z,
                    };
                })
                .sort()
        ).toEqual(locations.sort());
    });

    test("enables update of a node with multiple cartesian points", async () => {
        const id = "675a957f-a4ca-42fa-b33c-84bd9e9e66de";
        const locations = [...new Array(8)].map(() => ({
            x: 0.9849797878414392,
            y: 0.7501204372383654,
        }));
        const newLocations = locations.map((location) => ({
            x: 0.9360741777345538,
            y: location.y,
        }));

        const beforeResult = await testHelper.executeCypher(
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

        expect(
            beforeResult.records[0]
                ?.toObject()
                .r.locations.map((location) => {
                    expect(location.srid).toEqual(int(7203));
                    return {
                        x: location.x,
                        y: location.y,
                    };
                })
                .sort()
        ).toEqual(locations.sort());

        const update = /* GraphQL */ `
            mutation UpdateParts($id: String!, $locations: [CartesianPointInput!]) {
                ${Part.operations.update}(where: { id: $id }, update: { locations: $locations }) {
                    ${Part.plural} {
                        id
                        locations {
                            y
                            x
                            z
                            crs
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(update, { variableValues: { id, locations: newLocations } });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.operations.update][Part.plural][0]).toEqual({
            id,
            locations: newLocations.map((location) => ({ ...location, z: null, crs: "cartesian" })),
        });

        const result = await testHelper.executeCypher(`
                MATCH (r:${Part} {id: "${id}"})
                RETURN r { .id, .locations } as r
            `);

        expect(
            result.records[0]
                ?.toObject()
                .r.locations.map((location) => {
                    expect(location.srid).toEqual(int(7203));
                    return {
                        x: location.x,
                        y: location.y,
                    };
                })
                .sort()
        ).toEqual(newLocations.sort());
    });

    test("enables update of a node with multiple cartesian-3d points", async () => {
        const id = "b6c4a0ac-16ae-463b-9bd1-3ecae2307484";
        const locations = [...new Array(4)].map(() => ({
            x: 0.8189982105977833,
            y: 0.3447179892100394,
            z: 0.8076386945322156,
        }));
        const newLocations = locations.map((location) => ({
            x: 0.6024873733986169,
            y: location.y,
            z: location.z,
        }));

        const beforeResult = await testHelper.executeCypher(
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

        expect(
            beforeResult.records[0]
                ?.toObject()
                .r.locations.map((location) => {
                    expect(location.srid).toEqual(int(9157));
                    return {
                        x: location.x,
                        y: location.y,
                        z: location.z,
                    };
                })
                .sort()
        ).toEqual(locations.sort());

        const update = /* GraphQL */ `
            mutation UpdateParts($id: String!, $locations: [CartesianPointInput!]) {
                ${Part.operations.update}(where: { id: $id }, update: { locations: $locations }) {
                    ${Part.plural} {
                        id
                        locations {
                            y
                            x
                            z
                            crs
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(update, { variableValues: { id, locations: newLocations } });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.operations.update][Part.plural][0]).toEqual({
            id,
            locations: newLocations.map((location) => ({ ...location, crs: "cartesian-3d" })),
        });

        const result = await testHelper.executeCypher(`
                MATCH (r:${Part} {id: "${id}"})
                RETURN r { .id, .locations } as r
            `);

        expect(
            result.records[0]
                ?.toObject()
                .r.locations.map((location) => {
                    expect(location.srid).toEqual(int(9157));
                    return {
                        x: location.x,
                        y: location.y,
                        z: location.z,
                    };
                })
                .sort()
        ).toEqual(newLocations.sort());
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
                ${Part.plural}(where: { id: $id }) {
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
                ${Part.plural}(where: { id: $id }) {
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
