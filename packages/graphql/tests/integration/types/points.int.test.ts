import { Driver, int, Session } from "neo4j-driver";
import faker from "faker";
import { gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";
import neo4j from "../neo4j";
import { constructTestServer } from "../utils";
import { Neo4jGraphQL } from "../../../src/classes";

describe("[Point]", () => {
    let driver: Driver;
    let session: Session;
    let server;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type Route {
                id: String!
                waypoints: [Point!]!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        server = constructTestServer(neoSchema, driver);
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

        const create = gql`
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

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: create, variables: { id, waypoints } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.createRoutes.routes[0]).toEqual({
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

        const create = gql`
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

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: create, variables: { id, waypoints } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.createRoutes.routes[0]).toEqual({
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

        const update = gql`
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

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: update, variables: { id, waypoints: newWaypoints } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.updateRoutes.routes[0]).toEqual({
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

        const update = gql`
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

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: update, variables: { id, waypoints: newWaypoints } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.updateRoutes.routes[0]).toEqual({
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

        const { query } = createTestClient(server);

        // Test for equality
        const routesQuery = gql`
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

        const routesResult = await query({ query: routesQuery, variables: { waypoints } });

        expect(routesResult.errors).toBeFalsy();
        expect(routesResult.data.routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        // Test INCLUDES functionality
        const routesIncludesQuery = gql`
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

        const routesIncludesResult = await query({ query: routesIncludesQuery, variables: { waypoint: waypoints[0] } });

        expect(routesIncludesResult.errors).toBeFalsy();
        expect(routesIncludesResult.data.routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        // Test NOT INCLUDES functionality
        const routesNotIncludesQuery = gql`
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

        const routesNotIncludesResult = await query({
            query: routesNotIncludesQuery,
            variables: {
                waypoint: {
                    longitude: parseFloat(faker.address.longitude()),
                    latitude: parseFloat(faker.address.latitude()),
                },
            },
        });

        expect(routesNotIncludesResult.errors).toBeFalsy();
        expect(routesNotIncludesResult.data.routes).toContainEqual({
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

        const routesQuery = gql`
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

        const { query } = createTestClient(server);

        const gqlResult = await query({ query: routesQuery, variables: { id } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });
    });
});
