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

import { faker } from "@faker-js/faker";
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
        const id = faker.string.uuid();
        const locations = [...new Array(faker.number.int({ min: 2, max: 10 }))].map(() => ({
            x: faker.number.float(),
            y: faker.number.float(),
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
        const id = faker.string.uuid();
        const locations = [...new Array(faker.number.int({ min: 2, max: 10 }))].map(() => ({
            x: faker.number.float(),
            y: faker.number.float(),
            z: faker.number.float(),
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
        const id = faker.string.uuid();
        const locations = [...new Array(faker.number.int({ min: 2, max: 10 }))].map(() => ({
            x: faker.number.float(),
            y: faker.number.float(),
        }));
        const newLocations = locations.map((location) => ({
            x: faker.number.float(),
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
        const id = faker.string.uuid();
        const locations = [...new Array(faker.number.int({ min: 2, max: 10 }))].map(() => ({
            x: faker.number.float(),
            y: faker.number.float(),
            z: faker.number.float(),
        }));
        const newLocations = locations.map((location) => ({
            x: faker.number.float(),
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
        const id = faker.string.uuid();
        const locations = [...new Array(faker.number.int({ min: 2, max: 10 }))].map(() => ({
            x: faker.number.float(),
            y: faker.number.float(),
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
        const id = faker.string.uuid();
        const locations = [...new Array(faker.number.int({ min: 2, max: 10 }))].map(() => ({
            x: faker.number.float(),
            y: faker.number.float(),
            z: faker.number.float(),
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
