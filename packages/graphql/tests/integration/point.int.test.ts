import { Driver, int, Session } from "neo4j-driver";
import faker from "faker";
import { gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";
import neo4j from "./neo4j";
import { constructTestServer } from "./utils";
import { Neo4jGraphQL } from "../../src/classes";

describe("Point", () => {
    let driver: Driver;
    let session: Session;
    let server;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type Photograph {
                id: String!
                size: Int!
                location: Point!
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

    test("enables creation of a node with a wgs-84 point", async () => {
        const id = faker.random.uuid();
        const size = faker.random.number({});
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude());

        const create = gql`
            mutation CreatePhotographs($id: String!, $size: Int!, $longitude: Float!, $latitude: Float!) {
                createPhotographs(
                    input: [{ id: $id, size: $size, location: { longitude: $longitude, latitude: $latitude } }]
                ) {
                    photographs {
                        id
                        size
                        location {
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

        const gqlResult = await mutate({ mutation: create, variables: { id, size, longitude, latitude } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.createPhotographs.photographs[0]).toEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        const result = await session.run(`
                MATCH (p:Photograph {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(longitude);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(latitude);
        expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(4326));
    });

    test("enables creation of a node with a wgs-84-3d point", async () => {
        const id = faker.random.uuid();
        const size = faker.random.number({});
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude());
        const height = faker.random.float();

        const create = gql`
            mutation CreatePhotographs(
                $id: String!
                $size: Int!
                $longitude: Float!
                $latitude: Float!
                $height: Float!
            ) {
                createPhotographs(
                    input: [
                        {
                            id: $id
                            size: $size
                            location: { longitude: $longitude, latitude: $latitude, height: $height }
                        }
                    ]
                ) {
                    photographs {
                        id
                        size
                        location {
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

        const gqlResult = await mutate({ mutation: create, variables: { id, size, longitude, latitude, height } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.createPhotographs.photographs[0]).toEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height,
                crs: "wgs-84-3d",
            },
        });

        const result = await session.run(`
                MATCH (p:Photograph {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(longitude);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(latitude);
        expect((result.records[0].toObject() as any).p.location.z).toEqual(height);
        expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(4979));
    });

    test("enables update of a node with a wgs-84 point", async () => {
        const id = faker.random.uuid();
        const size = faker.random.number({});
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude());
        const newLatitude = parseFloat(faker.address.latitude());

        const beforeResult = await session.run(`
            CALL {
                CREATE (p:Photograph)
                SET p.id = "${id}"
                SET p.size = ${size}
                SET p.location = point({longitude: ${longitude}, latitude: ${latitude}})
                RETURN p
            }

            RETURN
            p { .id, .size, .location } AS p
        `);

        expect((beforeResult.records[0].toObject() as any).p.location.x).toEqual(longitude);
        expect((beforeResult.records[0].toObject() as any).p.location.y).toEqual(latitude);

        const update = gql`
            mutation UpdatePhotographs($id: String!, $longitude: Float!, $latitude: Float!) {
                updatePhotographs(
                    where: { id: $id }
                    update: { location: { longitude: $longitude, latitude: $latitude } }
                ) {
                    photographs {
                        id
                        size
                        location {
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

        const gqlResult = await mutate({ mutation: update, variables: { id, longitude, latitude: newLatitude } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.updatePhotographs.photographs[0]).toEqual({
            id,
            size,
            location: {
                latitude: newLatitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        const result = await session.run(`
                MATCH (p:Photograph {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(longitude);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(newLatitude);
        expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(4326));
    });

    test("enables update of a node with a wgs-84-3d point", async () => {
        const id = faker.random.uuid();
        const size = faker.random.number({});
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude());
        const height = faker.random.float();
        const newLatitude = parseFloat(faker.address.latitude());

        const beforeResult = await session.run(`
            CALL {
                CREATE (p:Photograph)
                SET p.id = "${id}"
                SET p.size = ${size}
                SET p.location = point({longitude: ${longitude}, latitude: ${latitude}, height: ${height}})
                RETURN p
            }

            RETURN
            p { .id, .size, .location } AS p
        `);

        expect((beforeResult.records[0].toObject() as any).p.location.x).toEqual(longitude);
        expect((beforeResult.records[0].toObject() as any).p.location.y).toEqual(latitude);
        expect((beforeResult.records[0].toObject() as any).p.location.z).toEqual(height);

        const update = gql`
            mutation UpdatePhotographs($id: String!, $longitude: Float!, $latitude: Float!, $height: Float!) {
                updatePhotographs(
                    where: { id: $id }
                    update: { location: { longitude: $longitude, latitude: $latitude, height: $height } }
                ) {
                    photographs {
                        id
                        size
                        location {
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

        const gqlResult = await mutate({
            mutation: update,
            variables: { id, longitude, latitude: newLatitude, height },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.updatePhotographs.photographs[0]).toEqual({
            id,
            size,
            location: {
                latitude: newLatitude,
                longitude,
                height,
                crs: "wgs-84-3d",
            },
        });

        const result = await session.run(`
                MATCH (p:Photograph {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(longitude);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(newLatitude);
        expect((result.records[0].toObject() as any).p.location.z).toEqual(height);
        expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(4979));
    });

    test("enables query of a node with a wgs-84 point", async () => {
        // Create node
        const id = faker.random.uuid();
        const size = faker.random.number({});
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude());

        const result = await session.run(`
            CALL {
                CREATE (p:Photograph)
                SET p.id = "${id}"
                SET p.size = ${size}
                SET p.location = point({longitude: ${longitude}, latitude: ${latitude}})
                RETURN p
            }

            RETURN
            p { .id, .size, .location } AS p
        `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(longitude);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(latitude);

        const { query } = createTestClient(server);

        // Test equality
        const photographsEqualsQuery = gql`
            query Photographs($longitude: Float!, $latitude: Float!) {
                photographs(where: { location: { longitude: $longitude, latitude: $latitude } }) {
                    id
                    size
                    location {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const equalsResult = await query({ query: photographsEqualsQuery, variables: { longitude, latitude } });

        expect(equalsResult.errors).toBeFalsy();
        expect(equalsResult.data.photographs[0]).toEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        // Test IN functionality
        const photographsInQuery = gql`
            query Photographs($locations: [PointInput]) {
                photographs(where: { location_IN: $locations }) {
                    id
                    size
                    location {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const inResult = await query({
            query: photographsInQuery,
            variables: [
                { longitude, latitude },
                { longitude: parseFloat(faker.address.longitude()), latitude: parseFloat(faker.address.latitude()) },
            ],
        });

        expect(inResult.errors).toBeFalsy();
        expect(inResult.data.photographs).toContainEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        // Test NOT IN functionality
        const photographsNotInQuery = gql`
            query Photographs($locations: [PointInput]) {
                photographs(where: { location_NOT_IN: $locations }) {
                    id
                    size
                    location {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const notInResult = await query({
            query: photographsNotInQuery,
            variables: [
                { longitude: parseFloat(faker.address.longitude()), latitude: parseFloat(faker.address.latitude()) },
                { longitude: parseFloat(faker.address.longitude()), latitude: parseFloat(faker.address.latitude()) },
            ],
        });

        expect(notInResult.errors).toBeFalsy();
        expect(notInResult.data.photographs).toContainEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        // Test less than
        const photographsLessThanQuery = gql`
            query Photographs($longitude: Float!, $latitude: Float!) {
                photographs(
                    where: { location_LT: { point: { longitude: $longitude, latitude: $latitude }, distance: 1000000 } }
                ) {
                    id
                    size
                    location {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const lessThanResult = await query({
            query: photographsLessThanQuery,
            variables: { longitude, latitude: latitude + 1 },
        });

        expect(lessThanResult.errors).toBeFalsy();
        expect(lessThanResult.data.photographs).toContainEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        // Test greater than
        const photographsGreaterThanQuery = gql`
            query Photographs($longitude: Float!, $latitude: Float!) {
                photographs(
                    where: { location_GT: { point: { longitude: $longitude, latitude: $latitude }, distance: 1 } }
                ) {
                    id
                    size
                    location {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const greaterThanResult = await query({
            query: photographsGreaterThanQuery,
            variables: { longitude, latitude: latitude + 1 },
        });

        expect(greaterThanResult.errors).toBeFalsy();
        expect(greaterThanResult.data.photographs).toContainEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });
    });

    test("enables query for equality of a node with a wgs-84-3d point", async () => {
        const id = faker.random.uuid();
        const size = faker.random.number({});
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude());
        const height = faker.random.float();

        const result = await session.run(`
            CALL {
                CREATE (p:Photograph)
                SET p.id = "${id}"
                SET p.size = ${size}
                SET p.location = point({longitude: ${longitude}, latitude: ${latitude}, height: ${height}})
                RETURN p
            }

            RETURN
            p { .id, .size, .location } AS p
        `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(longitude);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(latitude);
        expect((result.records[0].toObject() as any).p.location.z).toEqual(height);

        const photographsQuery = gql`
            query Photographs($longitude: Float!, $latitude: Float!, $height: Float) {
                photographs(where: { location: { longitude: $longitude, latitude: $latitude, height: $height } }) {
                    id
                    size
                    location {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const { query } = createTestClient(server);

        const gqlResult = await query({ query: photographsQuery, variables: { longitude, latitude, height } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.photographs[0]).toEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height,
                crs: "wgs-84-3d",
            },
        });
    });
});
