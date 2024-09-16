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

import { gql } from "graphql-tag";
import { int } from "neo4j-driver";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Subscriptions to spatial types", () => {
    const testHelper = new TestHelper();

    let plugin: TestSubscriptionsEngine;
    let typeMovie: UniqueType;

    beforeEach(async () => {
        plugin = new TestSubscriptionsEngine();
        typeMovie = testHelper.createUniqueType("Movie");
        const typeDefs = gql`
            type ${typeMovie} {
                title: String!
                synopsis: String
                filmedIn: Point
                location: CartesianPoint
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("create type with Point field", async () => {
        const longitude1 = parseFloat("-71.0007");
        const longitude2 = parseFloat("139.1539");
        const latitude1 = parseFloat("48.1706");
        const latitude2 = parseFloat("-50.9324");
        const height1 = 0.34409760613925755;
        const height2 = 0.19406892964616418;

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

        const gqlResult: any = await testHelper.executeGraphQL(query, {
            variableValues: { longitude1, latitude1, longitude2, latitude2, height1, height2 },
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.create][typeMovie.plural]).toIncludeSameMembers([
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

        const result = await testHelper.executeCypher(`
                MATCH (m: ${typeMovie})
                WHERE m.title = "As good as it gets" OR  m.title = "Avatar"
                RETURN m { .title, .filmedIn } as m
            `);

        const records = result.records.map((r) => r.toObject());
        expect(records).toIncludeSameMembers([
            {
                m: {
                    filmedIn: {
                        x: longitude1,
                        y: latitude1,
                        z: height1,
                        srid: int(4979),
                    },
                    title: "As good as it gets",
                },
            },
            {
                m: {
                    filmedIn: {
                        x: longitude2,
                        y: latitude2,
                        z: height2,
                        srid: int(4979),
                    },
                    title: "Avatar",
                },
            },
        ]);

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
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
                    id: expect.any(String),
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
        const longitude1 = parseFloat("-38.9491");
        const latitude1 = parseFloat("-75.8207");
        const height1 = 0.8940616026520729;
        const newLatitude = parseFloat("-42.7308");

        await testHelper.executeCypher(`
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
        const gqlResult: any = await testHelper.executeGraphQL(query, {
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

        const result = await testHelper.executeCypher(`
                MATCH (m: ${typeMovie})
                WHERE m.title = "As good as it gets"
                RETURN m { .title, .filmedIn } as m
            `);

        expect(result.records[0]?.toObject()).toEqual({
            m: {
                filmedIn: {
                    x: longitude1,
                    y: newLatitude,
                    z: height1,
                    srid: int(4979),
                },
                title: "As good as it gets",
            },
        });

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
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
        const longitude = parseFloat("154.8561");
        const latitude = parseFloat("73.8678");

        await testHelper.executeCypher(`
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

        const equalsResult = await testHelper.executeGraphQL(equalityFilterQuery, {
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

        const inResult = await testHelper.executeGraphQL(inFilterQuery, {
            variableValues: {
                locations: [
                    { longitude, latitude },
                    {
                        longitude: parseFloat("51.8962"),
                        latitude: parseFloat("-9.6844"),
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

        const notInResult = await testHelper.executeGraphQL(notInFilterQuery, {
            variableValues: {
                locations: [
                    {
                        longitude: parseFloat("12.4692"),
                        latitude: parseFloat("55.2318"),
                    },
                    {
                        longitude: parseFloat("162.6476"),
                        latitude: parseFloat("-10.2548"),
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
        const x1 = 0.8607480155769736;
        const y1 = 0.6322691068053246;
        const x2 = 0.21531713823787868;
        const y2 = 0.8199794858228415;

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

        const gqlResult: any = await testHelper.executeGraphQL(query, {
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

        const result = await testHelper.executeCypher(`
                MATCH (m: ${typeMovie})
                WHERE m.title = "As good as it gets" OR  m.title = "Avatar"
                RETURN m { .title, .location } as m
            `);

        const records = result.records.map((r) => r.toObject());
        expect(records).toIncludeSameMembers([
            {
                m: {
                    location: {
                        x: x1,
                        y: y1,
                        z: undefined,
                        srid: int(7203),
                    },
                    title: "As good as it gets",
                },
            },
            {
                m: {
                    location: {
                        x: x2,
                        y: y2,
                        z: undefined,
                        srid: int(7203),
                    },
                    title: "Avatar",
                },
            },
        ]);

        expect(plugin.eventList).toIncludeSameMembers([
            {
                id: expect.any(String),
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
                id: expect.any(String),
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
        ]);
    });
    test("update type with CartesianPoint field", async () => {
        const x = 0.8504534482490271;
        const y = 0.8674011980183423;
        const newY = 0.142022400861606;

        await testHelper.executeCypher(`
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
        const gqlResult: any = await testHelper.executeGraphQL(query, {
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

        const result = await testHelper.executeCypher(`
                MATCH (m: ${typeMovie})
                WHERE m.title = "As good as it gets" OR  m.title = "Avatar"
                RETURN m { .title, .location } as m
            `);

        expect(result.records[0]?.toObject()).toEqual({
            m: {
                location: {
                    x: x,
                    y: newY,
                    z: undefined,
                    srid: int(7203),
                },
                title: "As good as it gets",
            },
        });

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
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
        const x = 0.8776046128477901;
        const y = 0.01593078044243157;

        await testHelper.executeCypher(`
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

        const equalsResult = await testHelper.executeGraphQL(equalityFilterQuery, {
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

        const inResult = await testHelper.executeGraphQL(inFilterQuery, {
            variableValues: {
                locations: [
                    { x, y },
                    {
                        x: 0.425140418112278,
                        y: 0.5120728241745383,
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

        const notInResult = await testHelper.executeGraphQL(notInFilterQuery, {
            variableValues: {
                locations: [
                    {
                        x: 0.13677962007932365,
                        y: 0.05952018848620355,
                    },
                    {
                        x: 0.993210831657052,
                        y: 0.3956587021239102,
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
