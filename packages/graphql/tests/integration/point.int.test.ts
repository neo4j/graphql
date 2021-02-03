import { Driver, int, Point, Session } from "neo4j-driver";
import { graphql } from "graphql";
import faker from "faker";
import { describe, beforeAll, afterAll, test, expect, beforeEach, afterEach } from "@jest/globals";
import { ApolloServer, gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";
import neo4j from "./neo4j";
import { constructTestServer } from "./utils";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";

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
        expect((gqlResult.data as any).createPhotographs.photographs[0]).toEqual({
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
        expect((gqlResult.data as any).createPhotographs.photographs[0]).toEqual({
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
        expect((gqlResult.data as any).updatePhotographs.photographs[0]).toEqual({
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
        expect((gqlResult.data as any).updatePhotographs.photographs[0]).toEqual({
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

        const photographsQuery = gql`
            query Photographs($id: String!) {
                photographs(where: { id: $id }) {
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

        const gqlResult = await query({ query: photographsQuery, variables: { id } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).photographs[0]).toEqual({
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

    test("enables query of a node with a wgs-84-3d point", async () => {
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
            query Photographs($id: String!) {
                photographs(where: { id: $id }) {
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

        const gqlResult = await query({ query: photographsQuery, variables: { id } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).photographs[0]).toEqual({
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
