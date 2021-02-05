import { Driver, int, Session } from "neo4j-driver";
import faker from "faker";
import { describe, beforeAll, afterAll, test, expect, beforeEach, afterEach } from "@jest/globals";
import { gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";
import neo4j from "./neo4j";
import { constructTestServer } from "./utils";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

describe("[CartesianPoint]", () => {
    let driver: Driver;
    let session: Session;
    let server;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type Part {
                id: String!
                locations: [CartesianPoint!]!
            }
        `;
        const neoSchema = makeAugmentedSchema({ typeDefs });
        server = constructTestServer(neoSchema, driver);
    });

    beforeEach(async () => {
        session = await driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("enables creation of a node with multiple cartesian points", async () => {
        const id = faker.random.uuid();
        const locations = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.random.float(),
            y: faker.random.float(),
        }));

        const create = gql`
            mutation CreateParts($id: String!, $locations: [CartesianPointInput]) {
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

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: create, variables: { id, locations } });

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
            (result.records[0].toObject() as any).r.locations
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
        const id = faker.random.uuid();
        const locations = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.random.float(),
            y: faker.random.float(),
            z: faker.random.float(),
        }));

        const create = gql`
            mutation CreateParts($id: String!, $locations: [CartesianPointInput]) {
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

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: create, variables: { id, locations } });

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
            (result.records[0].toObject() as any).r.locations
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
        const id = faker.random.uuid();
        const locations = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.random.float(),
            y: faker.random.float(),
        }));
        const newLocations = locations.map((location) => ({
            x: faker.random.float(),
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
            (beforeResult.records[0].toObject() as any).r.locations
                .map((location) => {
                    expect(location.srid).toEqual(int(7203));
                    return {
                        x: location.x,
                        y: location.y,
                    };
                })
                .sort()
        ).toEqual(locations.sort());

        const update = gql`
            mutation UpdateParts($id: String!, $locations: [CartesianPointInput]) {
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

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: update, variables: { id, locations: newLocations } });

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
            (result.records[0].toObject() as any).r.locations
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
        const id = faker.random.uuid();
        const locations = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.random.float(),
            y: faker.random.float(),
            z: faker.random.float(),
        }));
        const newLocations = locations.map((location) => ({
            x: faker.random.float(),
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
            (beforeResult.records[0].toObject() as any).r.locations
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

        const update = gql`
            mutation UpdateParts($id: String!, $locations: [CartesianPointInput]) {
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

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: update, variables: { id, locations: newLocations } });

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
            (result.records[0].toObject() as any).r.locations
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
        const id = faker.random.uuid();
        const locations = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.random.float(),
            y: faker.random.float(),
        }));

        const result = await session.run(
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

        const partsQuery = gql`
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

        const { query } = createTestClient(server);

        const gqlResult = await query({ query: partsQuery, variables: { id } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).parts[0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, z: null, crs: "cartesian" })),
        });
    });

    test("enables query of a node with multiple cartesian-3d points", async () => {
        const id = faker.random.uuid();
        const locations = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            x: faker.random.float(),
            y: faker.random.float(),
            z: faker.random.float(),
        }));

        const result = await session.run(
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

        const partsQuery = gql`
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

        const { query } = createTestClient(server);

        const gqlResult = await query({ query: partsQuery, variables: { id } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).parts[0]).toEqual({
            id,
            locations: locations.map((location) => ({ ...location, crs: "cartesian-3d" })),
        });
    });
});
