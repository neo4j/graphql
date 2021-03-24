import { Driver, int, Session } from "neo4j-driver";
import faker from "faker";
import { graphql } from "graphql";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("[Point]", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type Route {
                id: String!
                waypoints: [Point!]!
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("enables creation of a node with multiple wgs-84 points", async () => {
        const id = faker.random.uuid();
        const waypoints = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
        }));

        const create = `
            mutation CreateRoutes($id: String!, $waypoints: [PointInput!]!) {
                createRoutes(input: [{ id: $id, waypoints: $waypoints }]) {
                    routes {
                        id
                        waypoints {
                            latitude
                            longitude
                            height
                            crs
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: create,
            contextValue: { driver },
            variableValues: { id, waypoints },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).createRoutes.routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        const result = await session.run(`
                MATCH (r:Route {id: "${id}"})
                RETURN r { .id, .waypoints} as r
            `);

        expect(
            (result.records[0].toObject() as any).r.waypoints
                .map((waypoint) => {
                    expect(waypoint.srid).toEqual(int(4326));
                    return {
                        longitude: waypoint.x,
                        latitude: waypoint.y,
                    };
                })
                .sort()
        ).toEqual(waypoints.sort());
    });

    test("enables creation of a node with multiple wgs-84-3d points", async () => {
        const id = faker.random.uuid();
        const waypoints = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
            height: faker.random.float(),
        }));

        const create = `
            mutation CreateRoutes($id: String!, $waypoints: [PointInput!]!) {
                createRoutes(input: [{ id: $id, waypoints: $waypoints }]) {
                    routes {
                        id
                        waypoints {
                            latitude
                            longitude
                            height
                            crs
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: create,
            contextValue: { driver },
            variableValues: { id, waypoints },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).createRoutes.routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });

        const result = await session.run(`
                MATCH (r:Route {id: "${id}"})
                RETURN r { .id, .waypoints} as r
            `);

        expect(
            (result.records[0].toObject() as any).r.waypoints
                .map((waypoint) => {
                    expect(waypoint.srid).toEqual(int(4979));
                    return {
                        longitude: waypoint.x,
                        latitude: waypoint.y,
                        height: waypoint.z,
                    };
                })
                .sort()
        ).toEqual(waypoints.sort());
    });

    test("enables update of a node with multiple wgs-84 points", async () => {
        const id = faker.random.uuid();
        const waypoints = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
        }));
        const newWaypoints = waypoints.map((waypoint) => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: waypoint.latitude,
        }));

        const beforeResult = await session.run(
            `
            CALL {
                CREATE (r:Route)
                SET r.id = $id
                SET r.waypoints = [p in $waypoints | point(p)]
                RETURN r
            }

            RETURN
            r { .id, .waypoints } AS r
        `,
            { id, waypoints }
        );

        expect(
            (beforeResult.records[0].toObject() as any).r.waypoints
                .map((waypoint) => {
                    expect(waypoint.srid).toEqual(int(4326));
                    return {
                        longitude: waypoint.x,
                        latitude: waypoint.y,
                    };
                })
                .sort()
        ).toEqual(waypoints.sort());

        const update = `
            mutation UpdateRoutes($id: String!, $waypoints: [PointInput!]) {
                updateRoutes(where: { id: $id }, update: { waypoints: $waypoints }) {
                    routes {
                        id
                        waypoints {
                            latitude
                            longitude
                            height
                            crs
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: update,
            contextValue: { driver },
            variableValues: { id, waypoints: newWaypoints },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).updateRoutes.routes[0]).toEqual({
            id,
            waypoints: newWaypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        const result = await session.run(`
                MATCH (r:Route {id: "${id}"})
                RETURN r { .id, .waypoints } as r
            `);

        expect(
            (result.records[0].toObject() as any).r.waypoints
                .map((waypoint) => {
                    expect(waypoint.srid).toEqual(int(4326));
                    return {
                        longitude: waypoint.x,
                        latitude: waypoint.y,
                    };
                })
                .sort()
        ).toEqual(newWaypoints.sort());
    });

    test("enables update of a node with multiple wgs-84-3d points", async () => {
        const id = faker.random.uuid();
        const waypoints = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
            height: faker.random.float(),
        }));
        const newWaypoints = waypoints.map((waypoint) => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: waypoint.latitude,
            height: waypoint.height,
        }));

        const beforeResult = await session.run(
            `
            CALL {
                CREATE (r:Route)
                SET r.id = $id
                SET r.waypoints = [p in $waypoints | point(p)]
                RETURN r
            }

            RETURN
            r { .id, .waypoints } AS r
        `,
            { id, waypoints }
        );

        expect(
            (beforeResult.records[0].toObject() as any).r.waypoints
                .map((waypoint) => {
                    expect(waypoint.srid).toEqual(int(4979));
                    return {
                        longitude: waypoint.x,
                        latitude: waypoint.y,
                        height: waypoint.z,
                    };
                })
                .sort()
        ).toEqual(waypoints.sort());

        const update = `
            mutation UpdateRoutes($id: String!, $waypoints: [PointInput!]) {
                updateRoutes(where: { id: $id }, update: { waypoints: $waypoints }) {
                    routes {
                        id
                        waypoints {
                            latitude
                            longitude
                            height
                            crs
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: update,
            contextValue: { driver },
            variableValues: { id, waypoints: newWaypoints },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).updateRoutes.routes[0]).toEqual({
            id,
            waypoints: newWaypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });

        const result = await session.run(`
                MATCH (r:Route {id: "${id}"})
                RETURN r { .id, .waypoints } as r
            `);

        expect(
            (result.records[0].toObject() as any).r.waypoints
                .map((waypoint) => {
                    expect(waypoint.srid).toEqual(int(4979));
                    return {
                        longitude: waypoint.x,
                        latitude: waypoint.y,
                        height: waypoint.z,
                    };
                })
                .sort()
        ).toEqual(newWaypoints.sort());
    });

    test("enables query of a node with multiple wgs-84 points", async () => {
        // Create test data and prepare for testing
        const id = faker.random.uuid();
        const waypoints = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
        }));

        await session.run(
            `
            CALL {
                CREATE (r:Route)
                SET r.id = $id
                SET r.waypoints = [p in $waypoints | point(p)]
                RETURN r
            }

            RETURN
            r { .id, .waypoints } AS r
        `,
            { id, waypoints }
        );

        // Test for equality
        const routesQuery = `
            query Routes($waypoints: [PointInput!]) {
                routes(where: { waypoints: $waypoints }) {
                    id
                    waypoints {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const routesResult = await graphql({
            schema: neoSchema.schema,
            source: routesQuery,
            contextValue: { driver },
            variableValues: { waypoints },
        });

        expect(routesResult.errors).toBeFalsy();
        expect((routesResult.data as any).routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        // Test INCLUDES functionality
        const routesIncludesQuery = `
            query RoutesIncludes($waypoint: PointInput) {
                routes(where: { waypoints_INCLUDES: $waypoint }) {
                    id
                    waypoints {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const routesIncludesResult = await graphql({
            schema: neoSchema.schema,
            source: routesIncludesQuery,
            contextValue: { driver },
            variableValues: { waypoint: waypoints[0] },
        });

        expect(routesIncludesResult.errors).toBeFalsy();
        expect((routesIncludesResult.data as any).routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        // Test NOT INCLUDES functionality
        const routesNotIncludesQuery = `
            query RoutesNotIncludes($waypoint: PointInput) {
                routes(where: { waypoints_NOT_INCLUDES: $waypoint }) {
                    id
                    waypoints {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const routesNotIncludesResult = await graphql({
            schema: neoSchema.schema,
            source: routesNotIncludesQuery,
            contextValue: { driver },
            variableValues: {
                waypoint: {
                    longitude: parseFloat(faker.address.longitude()),
                    latitude: parseFloat(faker.address.latitude()),
                },
            },
        });

        expect(routesNotIncludesResult.errors).toBeFalsy();
        expect((routesNotIncludesResult.data as any).routes).toContainEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });
    });

    test("enables query of a node with multiple wgs-84-3d points", async () => {
        const id = faker.random.uuid();
        const waypoints = [...new Array(faker.random.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
            height: faker.random.float(),
        }));

        await session.run(
            `
            CALL {
                CREATE (r:Route)
                SET r.id = $id
                SET r.waypoints = [p in $waypoints | point(p)]
                RETURN r
            }

            RETURN
            r { .id, .waypoints } AS r
        `,
            { id, waypoints }
        );

        const routesQuery = `
            query Routes($id: String!) {
                routes(where: { id: $id }) {
                    id
                    waypoints {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: routesQuery,
            contextValue: { driver },
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });
    });
});
