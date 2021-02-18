import { Driver, int, Point, Session } from "neo4j-driver";
import { graphql } from "graphql";
import faker from "faker";
import { describe, beforeAll, afterAll, test, expect, beforeEach, afterEach } from "@jest/globals";
import { ApolloServer, gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";
import neo4j from "./neo4j";
import { constructTestServer } from "./utils";
import { Neo4jGraphQL } from "../../src/classes";

describe("CartesianPoint", () => {
    let driver: Driver;
    let session: Session;
    let server;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type Part {
                serial: String!
                location: CartesianPoint!
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
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

    test("enables creation of a node with a cartesian point", async () => {
        const serial = faker.random.uuid();
        const x = faker.random.float();
        const y = faker.random.float();

        const create = gql`
            mutation CreateParts($serial: String!, $x: Float!, $y: Float!) {
                createParts(input: [{ serial: $serial, location: { x: $x, y: $y } }]) {
                    parts {
                        serial
                        location {
                            x
                            y
                            z
                            crs
                        }
                    }
                }
            }
        `;

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: create, variables: { serial, x, y } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).createParts.parts[0]).toEqual({
            serial,
            location: {
                x,
                y,
                z: null,
                crs: "cartesian",
            },
        });

        const result = await session.run(`
                MATCH (p:Part {serial: "${serial}"})
                RETURN p { .serial, .location} as p
            `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(y);
        expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(7203));
    });

    test("enables creation of a node with a cartesian-3d point", async () => {
        const serial = faker.random.uuid();
        const x = faker.random.float();
        const y = faker.random.float();
        const z = faker.random.float();

        const create = gql`
            mutation CreateParts($serial: String!, $x: Float!, $y: Float!, $z: Float!) {
                createParts(input: [{ serial: $serial, location: { x: $x, y: $y, z: $z } }]) {
                    parts {
                        serial
                        location {
                            x
                            y
                            z
                            crs
                        }
                    }
                }
            }
        `;

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: create, variables: { serial, x, y, z } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).createParts.parts[0]).toEqual({
            serial,
            location: {
                x,
                y,
                z,
                crs: "cartesian-3d",
            },
        });

        const result = await session.run(`
                MATCH (p:Part {serial: "${serial}"})
                RETURN p { .serial, .location} as p
            `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(y);
        expect((result.records[0].toObject() as any).p.location.z).toEqual(z);
        expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(9157));
    });

    test("enables update of a node with a cartesian point", async () => {
        const serial = faker.random.uuid();
        const x = faker.random.float();
        const y = faker.random.float();
        const newY = faker.random.float();

        const beforeResult = await session.run(`
            CALL {
                CREATE (p:Part)
                SET p.serial = "${serial}"
                SET p.location = point({x: ${x}, y: ${y}})
                RETURN p
            }
                
            RETURN 
            p { .serial, .location } AS p
        `);

        expect((beforeResult.records[0].toObject() as any).p.location.x).toEqual(x);
        expect((beforeResult.records[0].toObject() as any).p.location.y).toEqual(y);

        const update = gql`
            mutation UpdateParts($serial: String!, $x: Float!, $y: Float!) {
                updateParts(where: { serial: $serial }, update: { location: { x: $x, y: $y } }) {
                    parts {
                        serial
                        location {
                            x
                            y
                            z
                            crs
                        }
                    }
                }
            }
        `;

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: update, variables: { serial, x, y: newY } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).updateParts.parts[0]).toEqual({
            serial,
            location: {
                x,
                y: newY,
                z: null,
                crs: "cartesian",
            },
        });

        const result = await session.run(`
                MATCH (p:Part {serial: "${serial}"})
                RETURN p { .serial, .location} as p
            `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(newY);
        expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(7203));
    });

    test("enables update of a node with a cartesian-3d point", async () => {
        const serial = faker.random.uuid();
        const x = faker.random.float();
        const y = faker.random.float();
        const z = faker.random.float();
        const newY = faker.random.float();

        const beforeResult = await session.run(`
            CALL {
                CREATE (p:Part)
                SET p.serial = "${serial}"
                SET p.location = point({x: ${x}, y: ${y}, z: ${z}})
                RETURN p
            }
                
            RETURN 
            p { .serial, .location } AS p
        `);

        expect((beforeResult.records[0].toObject() as any).p.location.x).toEqual(x);
        expect((beforeResult.records[0].toObject() as any).p.location.y).toEqual(y);
        expect((beforeResult.records[0].toObject() as any).p.location.z).toEqual(z);

        const update = gql`
            mutation UpdateParts($serial: String!, $x: Float!, $y: Float!, $z: Float!) {
                updateParts(where: { serial: $serial }, update: { location: { x: $x, y: $y, z: $z } }) {
                    parts {
                        serial
                        location {
                            x
                            y
                            z
                            crs
                        }
                    }
                }
            }
        `;

        const { mutate } = createTestClient(server);

        const gqlResult = await mutate({ mutation: update, variables: { serial, x, y: newY, z } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).updateParts.parts[0]).toEqual({
            serial,
            location: {
                x,
                y: newY,
                z,
                crs: "cartesian-3d",
            },
        });

        const result = await session.run(`
                MATCH (p:Part {serial: "${serial}"})
                RETURN p { .serial, .location} as p
            `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(newY);
        expect((result.records[0].toObject() as any).p.location.z).toEqual(z);
        expect((result.records[0].toObject() as any).p.location.srid).toEqual(int(9157));
    });

    test("enables query of a node with a cartesian point", async () => {
        const serial = faker.random.uuid();
        const x = faker.random.float();
        const y = faker.random.float();

        const result = await session.run(`
            CALL {
                CREATE (p:Part)
                SET p.serial = "${serial}"
                SET p.location = point({x: ${x}, y: ${y}})
                RETURN p
            }
                
            RETURN 
            p { .id, .location } AS p
        `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(y);

        const partsQuery = gql`
            query Parts($serial: String!) {
                parts(where: { serial: $serial }) {
                    serial
                    location {
                        x
                        y
                        z
                        crs
                    }
                }
            }
        `;

        const { query } = createTestClient(server);

        const gqlResult = await query({ query: partsQuery, variables: { serial } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).parts[0]).toEqual({
            serial,
            location: {
                x,
                y,
                z: null,
                crs: "cartesian",
            },
        });
    });

    test("enables query of a node with a cartesian-3d point", async () => {
        const serial = faker.random.uuid();
        const x = faker.random.float();
        const y = faker.random.float();
        const z = faker.random.float();

        const result = await session.run(`
            CALL {
                CREATE (p:Part)
                SET p.serial = "${serial}"
                SET p.location = point({x: ${x}, y: ${y}, z: ${z}})
                RETURN p
            }
                
            RETURN 
            p { .id, .location } AS p
        `);

        expect((result.records[0].toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0].toObject() as any).p.location.y).toEqual(y);
        expect((result.records[0].toObject() as any).p.location.z).toEqual(z);

        const partsQuery = gql`
            query Parts($serial: String!) {
                parts(where: { serial: $serial }) {
                    serial
                    location {
                        x
                        y
                        z
                        crs
                    }
                }
            }
        `;

        const { query } = createTestClient(server);

        const gqlResult = await query({ query: partsQuery, variables: { serial } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).parts[0]).toEqual({
            serial,
            location: {
                x,
                y,
                z,
                crs: "cartesian-3d",
            },
        });
    });
});
