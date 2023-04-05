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
import { gql } from "apollo-server";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { int } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import Neo4j from "../neo4j";

describe("Subscriptions to spatial types", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    let plugin: TestSubscriptionsPlugin;

    const typeMovie = new UniqueType("Movie");

    beforeEach(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        plugin = new TestSubscriptionsPlugin();
        const typeDefs = gql`
            type ${typeMovie} {
                title: String!
                synopsis: String
                filmedIn: Point
                location: CartesianPoint
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                subscriptions: plugin,
            },
        });
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await cleanNodes(session, [typeMovie]);
        await session.close();
        await driver.close();
    });

    test("create type with Point field", async () => {
        const longitude1 = parseFloat(faker.address.longitude());
        const longitude2 = parseFloat(faker.address.longitude());
        const latitude1 = parseFloat(faker.address.latitude());
        const latitude2 = parseFloat(faker.address.latitude());
        const height1 = faker.datatype.float();
        const height2 = faker.datatype.float();

        const query = `
        mutation CreateMovie($longitude1: Float!, $latitude1: Float!, $height1: Float!, $longitude2: Float!, $latitude2: Float!, $height2: Float!)  {
            ${typeMovie.operations.create}(
                input: [
                    {
                        title: "As good as it gets",
                        filmedIn: { longitude: $longitude1, latitude: $latitude1, height: $height1 },
                        
                    }
                    {
                        title: "Avatar",
                        filmedIn: { longitude: $longitude2, latitude: $latitude2, height: $height2 },
                    }
                ]
            ) {
                ${typeMovie.plural} {
                    title
                    filmedIn {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        }
        `;

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: { longitude1, latitude1, longitude2, latitude2, height1, height2 },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.create][typeMovie.plural]).toEqual([
            {
                title: "As good as it gets",
                filmedIn: {
                    latitude: latitude1,
                    longitude: longitude1,
                    height: height1,
                    crs: "wgs-84-3d",
                },
            },
            {
                title: "Avatar",
                filmedIn: {
                    latitude: latitude2,
                    longitude: longitude2,
                    height: height2,
                    crs: "wgs-84-3d",
                },
            },
        ]);

        const result = await session.run(`
                MATCH (m: ${typeMovie})
                WHERE m.title = "As good as it gets" OR  m.title = "Avatar"
                RETURN m { .title, .filmedIn } as m
            `);

        expect((result.records[0]?.toObject() as any).m.filmedIn.x).toEqual(longitude1);
        expect((result.records[0]?.toObject() as any).m.filmedIn.y).toEqual(latitude1);
        expect((result.records[0]?.toObject() as any).m.filmedIn.z).toEqual(height1);
        expect((result.records[0]?.toObject() as any).m.filmedIn.srid).toEqual(int(4979));
        expect((result.records[1]?.toObject() as any).m.filmedIn.x).toEqual(longitude2);
        expect((result.records[1]?.toObject() as any).m.filmedIn.y).toEqual(latitude2);
        expect((result.records[1]?.toObject() as any).m.filmedIn.z).toEqual(height2);
        expect((result.records[1]?.toObject() as any).m.filmedIn.srid).toEqual(int(4979));

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: {
                        old: undefined,
                        new: {
                            title: "As good as it gets",
                            filmedIn: { x: longitude1, y: latitude1, z: height1, srid: { high: 0, low: 4979 } },
                        },
                    },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: {
                        old: undefined,
                        new: {
                            title: "Avatar",
                            filmedIn: { x: longitude2, y: latitude2, z: height2, srid: { high: 0, low: 4979 } },
                        },
                    },
                    typename: typeMovie.name,
                },
            ])
        );
    });
    test("update type with Point field", async () => {
        const longitude1 = parseFloat(faker.address.longitude());
        const latitude1 = parseFloat(faker.address.latitude());
        const height1 = faker.datatype.float();
        const newLatitude = parseFloat(faker.address.latitude());

        await session.run(`
            CALL {
                CREATE (m:${typeMovie})
                SET m.title = "As good as it gets"
                SET m.filmedIn = point({longitude: ${longitude1}, latitude: ${latitude1}, height: ${height1}})
                RETURN m
            }

            RETURN m { .title, .filmedIn } AS m
        `);
        const query = `
            mutation UpdateMovie($longitude1: Float!, $newLatitude: Float!, $latitude1: Float!, $height1: Float!)  {
                ${typeMovie.operations.update}(
                    where: { filmedIn: { longitude: $longitude1, latitude: $latitude1, height: $height1 } },
                    update: {
                        filmedIn: { latitude: $newLatitude, longitude: $longitude1, height: $height1 },
                    }
                ) {
                    ${typeMovie.plural} {
                        title
                        filmedIn {
                            latitude
                            longitude
                            height
                            crs
                        }
                    }
                }
            }
        `;
        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: { longitude1, newLatitude, latitude1, height1 },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.update][typeMovie.plural]).toEqual([
            {
                title: "As good as it gets",
                filmedIn: {
                    latitude: newLatitude,
                    longitude: longitude1,
                    height: height1,
                    crs: "wgs-84-3d",
                },
            },
        ]);

        const result = await session.run(`
                MATCH (m: ${typeMovie})
                WHERE m.title = "As good as it gets"
                RETURN m { .title, .filmedIn } as m
            `);
        expect((result.records[0]?.toObject() as any).m.filmedIn.x).toEqual(longitude1);
        expect((result.records[0]?.toObject() as any).m.filmedIn.y).toEqual(newLatitude);
        expect((result.records[0]?.toObject() as any).m.filmedIn.z).toEqual(height1);
        expect((result.records[0]?.toObject() as any).m.filmedIn.srid).toEqual(int(4979));

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: {
                        old: {
                            title: "As good as it gets",
                            filmedIn: { x: longitude1, y: latitude1, z: height1, srid: { high: 0, low: 4979 } },
                        },
                        new: {
                            title: "As good as it gets",
                            filmedIn: { x: longitude1, y: newLatitude, z: height1, srid: { high: 0, low: 4979 } },
                        },
                    },
                    typename: typeMovie.name,
                },
            ])
        );
    });
    test("query type with Point field and filters", async () => {
        const longitude = parseFloat(faker.address.longitude());
        const latitude = parseFloat(faker.address.latitude());

        await session.run(`
            CALL {
                CREATE (m:${typeMovie})
                SET m.title = "Up"
                SET m.filmedIn = point({longitude: ${longitude}, latitude: ${latitude}})
                RETURN m
            }

            RETURN m { .title, .filmedIn } AS m
        `);

        // Test equality
        const equalityFilterQuery = `
            query MoviesEqual($longitude: Float!, $latitude: Float!) {
                ${typeMovie.plural}(where: { filmedIn: { longitude: $longitude, latitude: $latitude } }) {
                    title
                    filmedIn {
                        latitude
                        longitude
                        height
                        crs
                    }
                }
            }
        `;

        const equalsResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: equalityFilterQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { longitude, latitude },
        });

        expect(equalsResult.errors).toBeFalsy();
        expect((equalsResult.data as any)[typeMovie.plural][0]).toEqual({
            title: "Up",
            filmedIn: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        // Test IN functionality
        const inFilterQuery = `
                query MoviesIn($locations: [PointInput!]) {
                    ${typeMovie.plural}(where: { filmedIn_IN: $locations }) {
                        title
                        filmedIn {
                            latitude
                            longitude
                            height
                            crs
                        }
                    }
                }
            `;

        const inResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: inFilterQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: {
                locations: [
                    { longitude, latitude },
                    {
                        longitude: parseFloat(faker.address.longitude()),
                        latitude: parseFloat(faker.address.latitude()),
                    },
                ],
            },
        });

        expect(inResult.errors).toBeFalsy();
        expect((inResult.data as any)[typeMovie.plural]).toContainEqual({
            title: "Up",
            filmedIn: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        // Test NOT_IN functionality
        const notInFilterQuery = `
                query MoviesNotIn($locations: [PointInput!]) {
                    ${typeMovie.plural}(where: { filmedIn_NOT_IN: $locations }) {
                        title
                        filmedIn {
                            latitude
                            longitude
                            height
                            crs
                        }
                    }
                }
            `;

        const notInResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: notInFilterQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: {
                locations: [
                    {
                        longitude: parseFloat(faker.address.longitude()),
                        latitude: parseFloat(faker.address.latitude()),
                    },
                    {
                        longitude: parseFloat(faker.address.longitude()),
                        latitude: parseFloat(faker.address.latitude()),
                    },
                ],
            },
        });

        expect(notInResult.errors).toBeFalsy();
        expect((notInResult.data as any)[typeMovie.plural]).toContainEqual({
            title: "Up",
            filmedIn: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });
    });

    test("create type with CartesianPoint field", async () => {
        const x1 = faker.datatype.float();
        const y1 = faker.datatype.float();
        const x2 = faker.datatype.float();
        const y2 = faker.datatype.float();

        const query = `
        mutation CreateMovie($x1: Float!, $x2: Float!, $y1: Float!, $y2: Float!)  {
            ${typeMovie.operations.create}(
                input: [
                    {
                        title: "As good as it gets",
                        location: { x: $x1, y: $y1 },
                        
                    }
                    {
                        title: "Avatar",
                        location: { x: $x2, y: $y2 },
                    }
                ]
            ) {
                ${typeMovie.plural} {
                    title
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

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: { x1, x2, y1, y2 },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.create][typeMovie.plural]).toEqual([
            {
                title: "As good as it gets",
                location: {
                    x: x1,
                    y: y1,
                    z: null,
                    crs: "cartesian",
                },
            },
            {
                title: "Avatar",
                location: {
                    x: x2,
                    y: y2,
                    z: null,
                    crs: "cartesian",
                },
            },
        ]);

        const result = await session.run(`
                MATCH (m: ${typeMovie})
                WHERE m.title = "As good as it gets" OR  m.title = "Avatar"
                RETURN m { .title, .location } as m
            `);

        expect((result.records[0]?.toObject() as any).m.location.x).toEqual(x1);
        expect((result.records[0]?.toObject() as any).m.location.y).toEqual(y1);
        expect((result.records[0]?.toObject() as any).m.location.z).toBeUndefined();
        expect((result.records[0]?.toObject() as any).m.location.srid).toEqual(int(7203));
        expect((result.records[1]?.toObject() as any).m.location.x).toEqual(x2);
        expect((result.records[1]?.toObject() as any).m.location.y).toEqual(y2);
        expect((result.records[1]?.toObject() as any).m.location.z).toBeUndefined();
        expect((result.records[1]?.toObject() as any).m.location.srid).toEqual(int(7203));

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: {
                        old: undefined,
                        new: {
                            title: "As good as it gets",
                            location: { x: x1, y: y1, z: undefined, srid: { high: 0, low: 7203 } },
                        },
                    },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: {
                        old: undefined,
                        new: {
                            title: "Avatar",
                            location: { x: x2, y: y2, z: undefined, srid: { high: 0, low: 7203 } },
                        },
                    },
                    typename: typeMovie.name,
                },
            ])
        );
    });
    test("update type with CartesianPoint field", async () => {
        const x = faker.datatype.float();
        const y = faker.datatype.float();
        const newY = faker.datatype.float();

        await session.run(`
            CALL {
                CREATE (m:${typeMovie})
                SET m.title = "As good as it gets"
                SET m.location = point({x: ${x}, y: ${y}})
                RETURN m
            }

            RETURN m { .title, .location } AS m
        `);
        const query = `
            mutation UpdateMovie($x: Float!, $y: Float!, $newY: Float!)  {
                ${typeMovie.operations.update}(
                    where: { location: { x: $x, y: $y } },
                    update: {
                        location: { x: $x, y: $newY },
                    }
                ) {
                    ${typeMovie.plural} {
                        title
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
        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
            variableValues: { x, y, newY },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.update][typeMovie.plural]).toEqual([
            {
                title: "As good as it gets",
                location: {
                    x,
                    y: newY,
                    z: null,
                    crs: "cartesian",
                },
            },
        ]);

        const result = await session.run(`
                MATCH (m: ${typeMovie})
                WHERE m.title = "As good as it gets" OR  m.title = "Avatar"
                RETURN m { .title, .location } as m
            `);

        expect((result.records[0]?.toObject() as any).m.location.x).toEqual(x);
        expect((result.records[0]?.toObject() as any).m.location.y).toEqual(newY);
        expect((result.records[0]?.toObject() as any).m.location.z).toBeUndefined();
        expect((result.records[0]?.toObject() as any).m.location.srid).toEqual(int(7203));

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(Number),
                    timestamp: expect.any(Number),
                    event: "update",
                    properties: {
                        old: {
                            title: "As good as it gets",
                            location: { x, y, z: undefined, srid: { high: 0, low: 7203 } },
                        },
                        new: {
                            title: "As good as it gets",
                            location: { x, y: newY, z: undefined, srid: { high: 0, low: 7203 } },
                        },
                    },
                    typename: typeMovie.name,
                },
            ])
        );
    });
    test("query type with CartesianPoint field and filters", async () => {
        const x = faker.datatype.float();
        const y = faker.datatype.float();

        await session.run(`
            CALL {
                CREATE (m:${typeMovie})
                SET m.title = "Up"
                SET m.location = point({x: ${x}, y: ${y}})
                RETURN m
            }

            RETURN m { .title, .location } AS m
        `);

        // Test equality
        const equalityFilterQuery = `
            query MoviesEqual($x: Float!, $y: Float!) {
                ${typeMovie.plural}(where: { location: { x: $x, y: $y } }) {
                    title
                    location {
                        x
                        y
                        z
                        crs
                    }
                }
            }
        `;

        const equalsResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: equalityFilterQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { x, y },
        });

        expect(equalsResult.errors).toBeFalsy();
        expect((equalsResult.data as any)[typeMovie.plural][0]).toEqual({
            title: "Up",
            location: {
                x,
                y,
                z: null,
                crs: "cartesian",
            },
        });

        // Test IN functionality
        const inFilterQuery = `
                query MoviesIn($locations: [CartesianPointInput!]) {
                    ${typeMovie.plural}(where: { location_IN: $locations }) {
                        title
                        location {
                            x
                            y
                            z
                            crs
                        }
                    }
                }
            `;

        const inResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: inFilterQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: {
                locations: [
                    { x, y },
                    {
                        x: faker.datatype.float(),
                        y: faker.datatype.float(),
                    },
                ],
            },
        });

        expect(inResult.errors).toBeFalsy();
        expect((inResult.data as any)[typeMovie.plural]).toContainEqual({
            title: "Up",
            location: {
                x,
                y,
                z: null,
                crs: "cartesian",
            },
        });

        // Test NOT_IN functionality
        const notInFilterQuery = `
                query MoviesNotIn($locations: [CartesianPointInput!]) {
                    ${typeMovie.plural}(where: { location_NOT_IN: $locations }) {
                        title
                        location {
                            x
                            y
                            z
                            crs
                        }
                    }
                }
            `;

        const notInResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: notInFilterQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: {
                locations: [
                    {
                        x: faker.datatype.float(),
                        y: faker.datatype.float(),
                    },
                    {
                        x: faker.datatype.float(),
                        y: faker.datatype.float(),
                    },
                ],
            },
        });

        expect(notInResult.errors).toBeFalsy();
        expect((notInResult.data as any)[typeMovie.plural]).toContainEqual({
            title: "Up",
            location: {
                x,
                y,
                z: null,
                crs: "cartesian",
            },
        });
    });
});
