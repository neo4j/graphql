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

import type { Driver, Session } from "neo4j-driver";
import { int } from "neo4j-driver";
import { faker } from "@faker-js/faker";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("[Point]", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = `
            type Route {
                id: String!
                waypoints: [Point!]!
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

    test("enables creation of a node with multiple wgs-84 points", async () => {
        const id = faker.datatype.uuid();
        const waypoints = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
        }));

        const create = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id, waypoints },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).createRoutes.routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        const result = await session.run(`
                MATCH (r:Route {id: "${id}"})
                RETURN r { .id, .waypoints} as r
            `);

        expect(
            (result.records[0]?.toObject() as any).r.waypoints
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
        const id = faker.datatype.uuid();
        const waypoints = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
            height: faker.datatype.float(),
        }));

        const create = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id, waypoints },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).createRoutes.routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });

        const result = await session.run(`
                MATCH (r:Route {id: "${id}"})
                RETURN r { .id, .waypoints} as r
            `);

        expect(
            (result.records[0]?.toObject() as any).r.waypoints
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
        const id = faker.datatype.uuid();
        const waypoints = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
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
            (beforeResult.records[0]?.toObject() as any).r.waypoints
                .map((waypoint) => {
                    expect(waypoint.srid).toEqual(int(4326));
                    return {
                        longitude: waypoint.x,
                        latitude: waypoint.y,
                    };
                })
                .sort()
        ).toEqual(waypoints.sort());

        const update = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id, waypoints: newWaypoints },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).updateRoutes.routes[0]).toEqual({
            id,
            waypoints: newWaypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        const result = await session.run(`
                MATCH (r:Route {id: "${id}"})
                RETURN r { .id, .waypoints } as r
            `);

        expect(
            (result.records[0]?.toObject() as any).r.waypoints
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
        const id = faker.datatype.uuid();
        const waypoints = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
            height: faker.datatype.float(),
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
            (beforeResult.records[0]?.toObject() as any).r.waypoints
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

        const update = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id, waypoints: newWaypoints },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).updateRoutes.routes[0]).toEqual({
            id,
            waypoints: newWaypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });

        const result = await session.run(`
                MATCH (r:Route {id: "${id}"})
                RETURN r { .id, .waypoints } as r
            `);

        expect(
            (result.records[0]?.toObject() as any).r.waypoints
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
        const id = faker.datatype.uuid();
        const waypoints = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
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

        // Test for equality
        const routesQuery = `
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

        const routesResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: routesQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { waypoints },
        });

        expect(routesResult.errors).toBeFalsy();
        expect((routesResult.data as any).routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        // Test INCLUDES functionality
        const routesIncludesQuery = `
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

        const routesIncludesResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: routesIncludesQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { waypoint: waypoints[0] },
        });

        expect(routesIncludesResult.errors).toBeFalsy();
        expect((routesIncludesResult.data as any).routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        // Test NOT INCLUDES functionality
        const routesNotIncludesQuery = `
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

        const routesNotIncludesResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: routesNotIncludesQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: {
                waypoint: {
                    longitude: parseFloat(faker.address.longitude()),
                    latitude: parseFloat(faker.address.latitude()),
                },
            },
        });

        expect(routesNotIncludesResult.errors).toBeFalsy();
        expect((routesNotIncludesResult.data as any).routes).toContainEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });
    });

    test("enables query of a node with multiple wgs-84-3d points", async () => {
        const id = faker.datatype.uuid();
        const waypoints = [...new Array(faker.datatype.number({ min: 2, max: 10 }))].map(() => ({
            longitude: parseFloat(faker.address.longitude()),
            latitude: parseFloat(faker.address.latitude()),
            height: faker.datatype.float(),
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

        const routesQuery = `
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: routesQuery,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).routes[0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });
    });
});
