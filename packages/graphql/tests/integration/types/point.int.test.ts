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
        const id = faker.string.uuid();
        const size = faker.number.int({ max: 100000 });
        const longitude = parseFloat(faker.location.longitude().toString());
        const latitude = parseFloat(faker.location.latitude().toString());

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
        const id = faker.string.uuid();
        const size = faker.number.int({ max: 100000 });
        const longitude = parseFloat(faker.location.longitude().toString());
        const latitude = parseFloat(faker.location.latitude().toString());
        const height = faker.number.float();

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
        const id = faker.string.uuid();
        const size = faker.number.int({ max: 100000 });
        const longitude = parseFloat(faker.location.longitude().toString());
        const latitude = parseFloat(faker.location.latitude().toString());
        const newLatitude = parseFloat(faker.location.latitude().toString());

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
        const id = faker.string.uuid();
        const size = faker.number.int({ max: 100000 });
        const longitude = parseFloat(faker.location.longitude().toString());
        const latitude = parseFloat(faker.location.latitude().toString());
        const height = faker.number.float();
        const newLatitude = parseFloat(faker.location.latitude().toString());

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
        const id = faker.string.uuid();
        const size = faker.number.int({ max: 100000 });
        const longitude = parseFloat(faker.location.longitude().toString());
        const latitude = parseFloat(faker.location.latitude({ max: 88 }).toString());

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
                        longitude: parseFloat(faker.location.longitude().toString()),
                        latitude: parseFloat(faker.location.latitude().toString()),
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
                        longitude: parseFloat(faker.location.longitude().toString()),
                        latitude: parseFloat(faker.location.latitude().toString()),
                    },
                    {
                        longitude: parseFloat(faker.location.longitude().toString()),
                        latitude: parseFloat(faker.location.latitude().toString()),
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
        const id = faker.string.uuid();
        const size = faker.number.int({ max: 100000 });
        const longitude = parseFloat(faker.location.longitude().toString());
        const latitude = parseFloat(faker.location.latitude().toString());
        const height = faker.number.float();

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
