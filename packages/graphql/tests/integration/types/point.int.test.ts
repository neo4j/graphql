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

import { int } from "neo4j-driver";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Point", () => {
    const testHelper = new TestHelper();

    let Photograph: UniqueType;

    beforeEach(async () => {
        Photograph = testHelper.createUniqueType("Photograph");

        const typeDefs = /* GraphQL */ `
            type ${Photograph} {
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
        await testHelper.initNeo4jGraphQL({ typeDefs, resolvers });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("enables creation of a node with a wgs-84 point", async () => {
        const id = "abc075b9-bb99-4447-9cdb-b3af98e991bb";
        const size = 40403;
        const longitude = parseFloat("98.459");
        const latitude = parseFloat("44.1705");

        const create = /* GraphQL */ `
            mutation CreatePhotographs($id: String!, $size: Int!, $longitude: Float!, $latitude: Float!) {
                ${Photograph.operations.create}(
                    input: [{ id: $id, size: $size, location: { longitude: $longitude, latitude: $latitude } }]
                ) {
                    ${Photograph.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(create, {
            variableValues: { id, size, longitude, latitude },
        });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Photograph.operations.create][Photograph.plural][0]).toEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (p:${Photograph} {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(longitude);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(latitude);
        expect((result.records[0] as any).toObject().p.location.srid).toEqual(int(4326));
    });

    test("enables creation of a node with a wgs-84-3d point", async () => {
        const id = "2922e9e1-ad37-4966-b940-d7d1915d1997";
        const size = 94309;
        const longitude = parseFloat("58.761");
        const latitude = parseFloat("-64.2159");
        const height = 0.23457504296675324;

        const create = /* GraphQL */ `
            mutation CreatePhotographs(
                $id: String!
                $size: Int!
                $longitude: Float!
                $latitude: Float!
                $height: Float!
            ) {
                ${Photograph.operations.create}(
                    input: [
                        {
                            id: $id
                            size: $size
                            location: { longitude: $longitude, latitude: $latitude, height: $height }
                        }
                    ]
                ) {
                    ${Photograph.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(create, {
            variableValues: { id, size, longitude, latitude, height },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Photograph.operations.create][Photograph.plural][0]).toEqual({
            id,
            size,
            location: {
                latitude,
                longitude,
                height,
                crs: "wgs-84-3d",
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (p:${Photograph} {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(longitude);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(latitude);
        expect((result.records[0] as any).toObject().p.location.z).toEqual(height);
        expect((result.records[0] as any).toObject().p.location.srid).toEqual(int(4979));
    });

    test("enables update of a node with a wgs-84 point", async () => {
        const id = "09132bb0-504a-407c-9096-6d945695dc89";
        const size = 95026;
        const longitude = parseFloat("117.5113");
        const latitude = parseFloat("9.5509");
        const newLatitude = parseFloat("10.6116");

        const beforeResult = await testHelper.executeCypher(`
            CALL {
                CREATE (p:${Photograph})
                SET p.id = "${id}"
                SET p.size = ${size}
                SET p.location = point({longitude: ${longitude}, latitude: ${latitude}})
                RETURN p
            }

            RETURN p { .id, .size, .location } AS p
        `);

        expect((beforeResult.records[0] as any).toObject().p.location.x).toEqual(longitude);
        expect((beforeResult.records[0] as any).toObject().p.location.y).toEqual(latitude);

        const update = `
            mutation UpdatePhotographs($id: String!, $longitude: Float!, $latitude: Float!) {
                ${Photograph.operations.update}(
                    where: { id: $id }
                    update: { location: { longitude: $longitude, latitude: $latitude } }
                ) {
                    ${Photograph.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(update, {
            variableValues: { id, longitude, latitude: newLatitude },
        });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Photograph.operations.update][Photograph.plural][0]).toEqual({
            id,
            size,
            location: {
                latitude: newLatitude,
                longitude,
                height: null,
                crs: "wgs-84",
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (p:${Photograph} {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

        expect((result.records[0] as any)?.toObject().p.location.x).toEqual(longitude);
        expect((result.records[0] as any)?.toObject().p.location.y).toEqual(newLatitude);
        expect((result.records[0] as any)?.toObject().p.location.srid).toEqual(int(4326));
    });

    test("enables update of a node with a wgs-84-3d point", async () => {
        const id = "3b3170d8-03ed-43be-ae02-876a4233e2c7";
        const size = 55312;
        const longitude = parseFloat("102.1785");
        const latitude = parseFloat("78.8688");
        const height = 0.9209601751063019;
        const newLatitude = parseFloat("71.2271");

        const beforeResult = await testHelper.executeCypher(`
            CALL {
                CREATE (p:${Photograph})
                SET p.id = "${id}"
                SET p.size = ${size}
                SET p.location = point({longitude: ${longitude}, latitude: ${latitude}, height: ${height}})
                RETURN p
            }

            RETURN p { .id, .size, .location } AS p
        `);

        expect((beforeResult.records[0] as any).toObject().p.location.x).toEqual(longitude);
        expect((beforeResult.records[0] as any).toObject().p.location.y).toEqual(latitude);
        expect((beforeResult.records[0] as any).toObject().p.location.z).toEqual(height);

        const update = /* GraphQL */ `
            mutation UpdatePhotographs($id: String!, $longitude: Float!, $latitude: Float!, $height: Float!) {
                ${Photograph.operations.update}(
                    where: { id: $id }
                    update: { location: { longitude: $longitude, latitude: $latitude, height: $height } }
                ) {
                    ${Photograph.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(update, {
            variableValues: { id, longitude, latitude: newLatitude, height },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Photograph.operations.update][Photograph.plural][0]).toEqual({
            id,
            size,
            location: {
                latitude: newLatitude,
                longitude,
                height,
                crs: "wgs-84-3d",
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (p:${Photograph} {id: "${id}"})
                RETURN p { .id, .size, .location} as p
            `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(longitude);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(newLatitude);
        expect((result.records[0] as any).toObject().p.location.z).toEqual(height);
        expect((result.records[0] as any).toObject().p.location.srid).toEqual(int(4979));
    });

    test("enables query of a node with a wgs-84 point", async () => {
        // Create node
        const id = "f8a5a58a-7380-4a39-9103-07a2c0528d8e";
        const size = 31364;
        const longitude = parseFloat("62.5196");
        const latitude = parseFloat("-41.1021");

        const result = await testHelper.executeCypher(`
            CALL {
                CREATE (p:${Photograph})
                SET p.id = "${id}"
                SET p.size = ${size}
                SET p.location = point({longitude: ${longitude}, latitude: ${latitude}})
                RETURN p
            }

            RETURN p { .id, .size, .location } AS p
        `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(longitude);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(latitude);

        // Test equality
        const photographsEqualsQuery = /* GraphQL */ `
            query Photographs($longitude: Float!, $latitude: Float!) {
                ${Photograph.plural}(where: { location: { longitude: $longitude, latitude: $latitude } }) {
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

        const equalsResult = await testHelper.executeGraphQL(photographsEqualsQuery, {
            variableValues: { longitude, latitude },
        });

        expect(equalsResult.errors).toBeFalsy();
        expect((equalsResult.data as any)[Photograph.plural][0]).toEqual({
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
        const photographsInQuery = /* GraphQL */ `
            query Photographs($locations: [PointInput!]) {
                ${Photograph.plural}(where: { location_IN: $locations }) {
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

        const inResult = await testHelper.executeGraphQL(photographsInQuery, {
            variableValues: {
                locations: [
                    { longitude, latitude },
                    {
                        longitude: parseFloat("-156.8208"),
                        latitude: parseFloat("64.9108"),
                    },
                ],
            },
        });

        expect(inResult.errors).toBeFalsy();
        expect((inResult.data as any)[Photograph.plural]).toContainEqual({
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
        const photographsNotInQuery = /* GraphQL */ `
            query Photographs($locations: [PointInput!]) {
                ${Photograph.plural}(where: { location_NOT_IN: $locations }) {
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

        const notInResult = await testHelper.executeGraphQL(photographsNotInQuery, {
            variableValues: {
                locations: [
                    {
                        longitude: parseFloat("147.0866"),
                        latitude: parseFloat("-64.3432"),
                    },
                    {
                        longitude: parseFloat("-97.4775"),
                        latitude: parseFloat("-61.2485"),
                    },
                ],
            },
        });

        expect(notInResult.errors).toBeFalsy();
        expect((notInResult.data as any)[Photograph.plural]).toContainEqual({
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
        const photographsLessThanQuery = /* GraphQL */ `
            query Photographs($longitude: Float!, $latitude: Float!) {
                ${Photograph.plural}(
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

        const lessThanResult = await testHelper.executeGraphQL(photographsLessThanQuery, {
            variableValues: { longitude, latitude: latitude + 1 },
        });

        expect(lessThanResult.errors).toBeFalsy();
        expect((lessThanResult.data as any)[Photograph.plural]).toContainEqual({
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
        const photographsGreaterThanQuery = /* GraphQL */ `
            query Photographs($longitude: Float!, $latitude: Float!) {
                ${Photograph.plural}(
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

        const greaterThanResult = await testHelper.executeGraphQL(photographsGreaterThanQuery, {
            variableValues: { longitude, latitude: latitude + 1 },
        });

        expect(greaterThanResult.errors).toBeFalsy();
        expect((greaterThanResult.data as any)[Photograph.plural]).toContainEqual({
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
        const id = "3019fe82-5231-4103-8662-39c1fcc7d50c";
        const size = 99119;
        const longitude = parseFloat("125.6358");
        const latitude = parseFloat("-7.2045");
        const height = 0.6950517320074141;

        const result = await testHelper.executeCypher(`
            CALL {
                CREATE (p:${Photograph})
                SET p.id = "${id}"
                SET p.size = ${size}
                SET p.location = point({longitude: ${longitude}, latitude: ${latitude}, height: ${height}})
                RETURN p
            }

            RETURN p { .id, .size, .location } AS p
        `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(longitude);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(latitude);
        expect((result.records[0] as any).toObject().p.location.z).toEqual(height);

        const photographsQuery = /* GraphQL */ `
            query Photographs($longitude: Float!, $latitude: Float!, $height: Float) {
                ${Photograph.plural}(where: { location: { longitude: $longitude, latitude: $latitude, height: $height } }) {
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

        const gqlResult = await testHelper.executeGraphQL(photographsQuery, {
            variableValues: { longitude, latitude, height },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Photograph.plural][0]).toEqual({
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
