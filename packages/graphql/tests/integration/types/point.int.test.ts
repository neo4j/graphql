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

import { Driver, int, Session } from "neo4j-driver";
import faker from "faker";
import { graphql } from "graphql";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Point", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type Photograph {
                id: String!
                size: Int!
                location: Point!
            }

            type Query {
                custom: String!
            }
        `;
        // Dummy custom resolvers to validate fix for https://github.com/neo4j/graphql/issues/278
        const resolvers = {
            Query: {
                custom: () => "hello",
            },
        };
        neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
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

        const create = `
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

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: create,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: { id, size, longitude, latitude },
        });

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

        const create = `
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

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: create,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: { id, size, longitude, latitude, height },
        });

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

        const update = `
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

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: update,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: { id, longitude, latitude: newLatitude },
        });

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

        const update = `
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

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: update,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: { id, longitude, latitude: newLatitude, height },
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
        // Create node
        const id = faker.random.uuid();
        const size = faker.random.number({});
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude(88));

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

        // Test equality
        const photographsEqualsQuery = `
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

        const equalsResult = await graphql({
            schema: neoSchema.schema,
            source: photographsEqualsQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: { longitude, latitude },
        });

        expect(equalsResult.errors).toBeFalsy();
        expect((equalsResult.data as any).photographs[0]).toEqual({
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
        const photographsInQuery = `
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

        const inResult = await graphql({
            schema: neoSchema.schema,
            source: photographsInQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: [
                { longitude, latitude },
                { longitude: parseFloat(faker.address.longitude()), latitude: parseFloat(faker.address.latitude()) },
            ],
        });

        expect(inResult.errors).toBeFalsy();
        expect((inResult.data as any).photographs).toContainEqual({
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
        const photographsNotInQuery = `
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

        const notInResult = await graphql({
            schema: neoSchema.schema,
            source: photographsNotInQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: [
                { longitude: parseFloat(faker.address.longitude()), latitude: parseFloat(faker.address.latitude()) },
                { longitude: parseFloat(faker.address.longitude()), latitude: parseFloat(faker.address.latitude()) },
            ],
        });

        expect(notInResult.errors).toBeFalsy();
        expect((notInResult.data as any).photographs).toContainEqual({
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
        const photographsLessThanQuery = `
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

        const lessThanResult = await graphql({
            schema: neoSchema.schema,
            source: photographsLessThanQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: { longitude, latitude: latitude + 1 },
        });

        expect(lessThanResult.errors).toBeFalsy();
        expect((lessThanResult.data as any).photographs).toContainEqual({
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
        const photographsGreaterThanQuery = `
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

        const greaterThanResult = await graphql({
            schema: neoSchema.schema,
            source: photographsGreaterThanQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: { longitude, latitude: latitude + 1 },
        });

        expect(greaterThanResult.errors).toBeFalsy();
        expect((greaterThanResult.data as any).photographs).toContainEqual({
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

        const photographsQuery = `
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

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: photographsQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            variableValues: { longitude, latitude, height },
        });

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
