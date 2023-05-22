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
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { int } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";

describe("CartesianPoint", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = `
            type Part {
                serial: String!
                location: CartesianPoint!
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

    test("enables creation of a node with a cartesian point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();

        const create = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { serial, x, y },
        });

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

        expect((result.records[0]?.toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0]?.toObject() as any).p.location.y).toEqual(y);
        expect((result.records[0]?.toObject() as any).p.location.srid).toEqual(int(7203));
    });

    test("enables creation of a node with a cartesian-3d point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();
        const z = faker.number.float();

        const create = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { serial, x, y, z },
        });

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

        expect((result.records[0]?.toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0]?.toObject() as any).p.location.y).toEqual(y);
        expect((result.records[0]?.toObject() as any).p.location.z).toEqual(z);
        expect((result.records[0]?.toObject() as any).p.location.srid).toEqual(int(9157));
    });

    test("enables update of a node with a cartesian point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();
        const newY = faker.number.float();

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

        expect((beforeResult.records[0]?.toObject() as any).p.location.x).toEqual(x);
        expect((beforeResult.records[0]?.toObject() as any).p.location.y).toEqual(y);

        const update = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { serial, x, y: newY },
        });

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

        expect((result.records[0]?.toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0]?.toObject() as any).p.location.y).toEqual(newY);
        expect((result.records[0]?.toObject() as any).p.location.srid).toEqual(int(7203));
    });

    test("enables update of a node with a cartesian-3d point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();
        const z = faker.number.float();
        const newY = faker.number.float();

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

        expect((beforeResult.records[0]?.toObject() as any).p.location.x).toEqual(x);
        expect((beforeResult.records[0]?.toObject() as any).p.location.y).toEqual(y);
        expect((beforeResult.records[0]?.toObject() as any).p.location.z).toEqual(z);

        const update = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { serial, x, y: newY, z },
        });

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

        expect((result.records[0]?.toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0]?.toObject() as any).p.location.y).toEqual(newY);
        expect((result.records[0]?.toObject() as any).p.location.z).toEqual(z);
        expect((result.records[0]?.toObject() as any).p.location.srid).toEqual(int(9157));
    });

    test("enables query of a node with a cartesian point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();

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

        expect((result.records[0]?.toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0]?.toObject() as any).p.location.y).toEqual(y);

        const partsQuery = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: partsQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { serial },
        });

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
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();
        const z = faker.number.float();

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

        expect((result.records[0]?.toObject() as any).p.location.x).toEqual(x);
        expect((result.records[0]?.toObject() as any).p.location.y).toEqual(y);
        expect((result.records[0]?.toObject() as any).p.location.z).toEqual(z);

        const partsQuery = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: partsQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { serial },
        });

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
