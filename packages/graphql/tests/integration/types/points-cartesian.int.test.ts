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

import type { Driver, Session } from "neo4j-driver";
import { int } from "neo4j-driver";
import { graphql } from "graphql";
import { faker } from "@faker-js/faker";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("[CartesianPoint]", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = `
            type Part {
                id: String!
                locations: [CartesianPoint!]!
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("enables creation of a node with multiple cartesian points", async () => {
        const id = faker.datatype.uuid();
        const locations = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.datatype.float(),
            y: faker.datatype.float(),
        }));

        const create = `
            mutation CreateParts($id: String!, $locations: [CartesianPointInput!]!) {
                createParts(input: [{ id: $id, locations: $locations }]) {
                    parts {
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id, locations },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).createParts.parts[0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, z: null, crs: "cartesian" })),
        });

        const result = await session.run(`
                MATCH (r:Part {id: "${id}"})
                RETURN r { .id, .locations} as r
            `);

        expect(
            (result.records[0]?.toObject() as any).r.locations
                .map((location) => {
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
        const id = faker.datatype.uuid();
        const locations = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.datatype.float(),
            y: faker.datatype.float(),
            z: faker.datatype.float(),
        }));

        const create = `
            mutation CreateParts($id: String!, $locations: [CartesianPointInput!]!) {
                createParts(input: [{ id: $id, locations: $locations }]) {
                    parts {
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id, locations },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).createParts.parts[0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, crs: "cartesian-3d" })),
        });

        const result = await session.run(`
                MATCH (r:Part {id: "${id}"})
                RETURN r { .id, .locations} as r
            `);

        expect(
            (result.records[0]?.toObject() as any).r.locations
                .map((location) => {
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
        const id = faker.datatype.uuid();
        const locations = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.datatype.float(),
            y: faker.datatype.float(),
        }));
        const newLocations = locations.map((location) => ({
            x: faker.datatype.float(),
            y: location.y,
        }));

        const beforeResult = await session.run(
            `
            CALL {
                CREATE (r:Part)
                SET r.id = $id
                SET r.locations = [p in $locations | point(p)]
                RETURN r
            }

            RETURN
            r { .id, .locations } AS r
        `,
            { id, locations }
        );

        expect(
            (beforeResult.records[0]?.toObject() as any).r.locations
                .map((location) => {
                    expect(location.srid).toEqual(int(7203));
                    return {
                        x: location.x,
                        y: location.y,
                    };
                })
                .sort()
        ).toEqual(locations.sort());

        const update = `
            mutation UpdateParts($id: String!, $locations: [CartesianPointInput!]) {
                updateParts(where: { id: $id }, update: { locations: $locations }) {
                    parts {
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id, locations: newLocations },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).updateParts.parts[0]).toEqual({
            id,
            locations: newLocations.map((location) => ({ ...location, z: null, crs: "cartesian" })),
        });

        const result = await session.run(`
                MATCH (r:Part {id: "${id}"})
                RETURN r { .id, .locations } as r
            `);

        expect(
            (result.records[0]?.toObject() as any).r.locations
                .map((location) => {
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
        const id = faker.datatype.uuid();
        const locations = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.datatype.float(),
            y: faker.datatype.float(),
            z: faker.datatype.float(),
        }));
        const newLocations = locations.map((location) => ({
            x: faker.datatype.float(),
            y: location.y,
            z: location.z,
        }));

        const beforeResult = await session.run(
            `
            CALL {
                CREATE (r:Part)
                SET r.id = $id
                SET r.locations = [p in $locations | point(p)]
                RETURN r
            }

            RETURN
            r { .id, .locations } AS r
        `,
            { id, locations }
        );

        expect(
            (beforeResult.records[0]?.toObject() as any).r.locations
                .map((location) => {
                    expect(location.srid).toEqual(int(9157));
                    return {
                        x: location.x,
                        y: location.y,
                        z: location.z,
                    };
                })
                .sort()
        ).toEqual(locations.sort());

        const update = `
            mutation UpdateParts($id: String!, $locations: [CartesianPointInput!]) {
                updateParts(where: { id: $id }, update: { locations: $locations }) {
                    parts {
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id, locations: newLocations },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).updateParts.parts[0]).toEqual({
            id,
            locations: newLocations.map((location) => ({ ...location, crs: "cartesian-3d" })),
        });

        const result = await session.run(`
                MATCH (r:Part {id: "${id}"})
                RETURN r { .id, .locations } as r
            `);

        expect(
            (result.records[0]?.toObject() as any).r.locations
                .map((location) => {
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
        const id = faker.datatype.uuid();
        const locations = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.datatype.float(),
            y: faker.datatype.float(),
        }));

        await session.run(
            `
            CALL {
                CREATE (r:Part)
                SET r.id = $id
                SET r.locations = [p in $locations | point(p)]
                RETURN r
            }

            RETURN
            r { .id, .locations } AS r
        `,
            { id, locations }
        );

        const partsQuery = `
            query Parts($id: String!) {
                parts(where: { id: $id }) {
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: partsQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).parts[0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, z: null, crs: "cartesian" })),
        });
    });

    test("enables query of a node with multiple cartesian-3d points", async () => {
        const id = faker.datatype.uuid();
        const locations = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.datatype.float(),
            y: faker.datatype.float(),
            z: faker.datatype.float(),
        }));

        await session.run(
            `
            CALL {
                CREATE (r:Part)
                SET r.id = $id
                SET r.locations = [p in $locations | point(p)]
                RETURN r
            }

            RETURN
            r { .id, .locations } AS r
        `,
            { id, locations }
        );

        const partsQuery = `
            query Parts($id: String!) {
                parts(where: { id: $id }) {
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: partsQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).parts[0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, crs: "cartesian-3d" })),
        });
    });
});
