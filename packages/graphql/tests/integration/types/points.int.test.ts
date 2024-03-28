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

describe("[Point]", () => {
    const testHelper = new TestHelper();
    let Route: UniqueType;

    beforeEach(async () => {
        Route = testHelper.createUniqueType("Route");
        const typeDefs = /* GraphQL */ `
            type ${Route} {
                id: String!
                waypoints: [Point!]!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("enables creation of a node with multiple wgs-84 points", async () => {
        const id = "68b83f50-bf58-4858-b559-ac9f0480b84d";
        const waypoints = [...new Array(3)].map(() => ({
            longitude: parseFloat("-109.3787"),
            latitude: parseFloat("-86.9408"),
        }));

        const create = `
            mutation CreateRoutes($id: String!, $waypoints: [PointInput!]!) {
                ${Route.operations.create}(input: [{ id: $id, waypoints: $waypoints }]) {
                    ${Route.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(create, { variableValues: { id, waypoints } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Route.operations.create][Route.plural][0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        const result = await testHelper.executeCypher(`
                MATCH (r:${Route} {id: "${id}"})
                RETURN r { .id, .waypoints} as r
            `);

        expect(
            result.records[0]
                ?.toObject()
                .r.waypoints.map((waypoint) => {
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
        const id = "dc253044-0795-4899-8419-8eedce25e2c3";
        const waypoints = [...new Array(4)].map(() => ({
            longitude: parseFloat("147.2789"),
            latitude: parseFloat("-32.9044"),
            height: 0.33790676412172616,
        }));

        const create = `
            mutation CreateRoutes($id: String!, $waypoints: [PointInput!]!) {
                ${Route.operations.create}(input: [{ id: $id, waypoints: $waypoints }]) {
                    ${Route.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(create, { variableValues: { id, waypoints } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Route.operations.create][Route.plural][0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });

        const result = await testHelper.executeCypher(`
                MATCH (r:${Route} {id: "${id}"})
                RETURN r { .id, .waypoints} as r
            `);

        expect(
            result.records[0]
                ?.toObject()
                .r.waypoints.map((waypoint) => {
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
        const id = "583824bf-87c3-48c7-a482-feb308e39553";
        const waypoints = [...new Array(3)].map(() => ({
            longitude: parseFloat("177.9109"),
            latitude: parseFloat("58.4798"),
        }));
        const newWaypoints = waypoints.map((waypoint) => ({
            longitude: parseFloat("128.9727"),
            latitude: waypoint.latitude,
        }));

        const beforeResult = await testHelper.executeCypher(
            `
            CALL {
                CREATE (r:${Route})
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
            beforeResult.records[0]
                ?.toObject()
                .r.waypoints.map((waypoint) => {
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
                ${Route.operations.update}(where: { id: $id }, update: { waypoints: $waypoints }) {
                    ${Route.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(update, { variableValues: { id, waypoints: newWaypoints } });
        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Route.operations.update][Route.plural][0]).toEqual({
            id,
            waypoints: newWaypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        const result = await testHelper.executeCypher(`
                MATCH (r:${Route} {id: "${id}"})
                RETURN r { .id, .waypoints } as r
            `);

        expect(
            result.records[0]
                ?.toObject()
                .r.waypoints.map((waypoint) => {
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
        const id = "2f2a284c-17c4-4d40-8a87-63516338d505";
        const waypoints = [...new Array(4)].map(() => ({
            longitude: parseFloat("25.2545"),
            latitude: parseFloat("-73.11"),
            height: 0.14806141727603972,
        }));
        const newWaypoints = waypoints.map((waypoint) => ({
            longitude: parseFloat("-81.0101"),
            latitude: waypoint.latitude,
            height: waypoint.height,
        }));

        const beforeResult = await testHelper.executeCypher(
            `
            CALL {
                CREATE (r:${Route})
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
            beforeResult.records[0]
                ?.toObject()
                .r.waypoints.map((waypoint) => {
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
                ${Route.operations.update}(where: { id: $id }, update: { waypoints: $waypoints }) {
                    ${Route.plural} {
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

        const gqlResult = await testHelper.executeGraphQL(update, { variableValues: { id, waypoints: newWaypoints } });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Route.operations.update][Route.plural][0]).toEqual({
            id,
            waypoints: newWaypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });

        const result = await testHelper.executeCypher(`
                MATCH (r:${Route} {id: "${id}"})
                RETURN r { .id, .waypoints } as r
            `);

        expect(
            result.records[0]
                ?.toObject()
                .r.waypoints.map((waypoint) => {
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
        const id = "25c4676e-1e38-4b1b-b156-6a7e28c8013e";
        const waypoints = [...new Array(9)].map(() => ({
            longitude: parseFloat("34.1879"),
            latitude: parseFloat("30.5402"),
        }));

        await testHelper.executeCypher(
            `
            CALL {
                CREATE (r:${Route})
                SET r.id = $id
                SET r.waypoints = [p in $waypoints | point(p)]
                RETURN r
            }

            RETURN r { .id, .waypoints } AS r
        `,
            { id, waypoints }
        );

        // Test for equality
        const routesQuery = /* GraphQL */ `
            query Routes($waypoints: [PointInput!]) {
                ${Route.plural}(where: { waypoints: $waypoints }) {
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

        const routesResult = await testHelper.executeGraphQL(routesQuery, { variableValues: { waypoints } });

        expect(routesResult.errors).toBeFalsy();
        expect((routesResult.data as any)[Route.plural][0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        // Test INCLUDES functionality
        const routesIncludesQuery = /* GraphQL */ `
            query RoutesIncludes($waypoint: PointInput) {
                ${Route.plural}(where: { waypoints_INCLUDES: $waypoint }) {
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

        const routesIncludesResult = await testHelper.executeGraphQL(routesIncludesQuery, {
            variableValues: { waypoint: waypoints[0] },
        });

        expect(routesIncludesResult.errors).toBeFalsy();
        expect((routesIncludesResult.data as any)[Route.plural][0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });

        // Test NOT INCLUDES functionality
        const routesNotIncludesQuery = /* GraphQL */ `
            query RoutesNotIncludes($waypoint: PointInput) {
                ${Route.plural}(where: { waypoints_NOT_INCLUDES: $waypoint }) {
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

        const routesNotIncludesResult = await testHelper.executeGraphQL(routesNotIncludesQuery, {
            variableValues: {
                waypoint: {
                    longitude: parseFloat("124.5589"),
                    latitude: parseFloat("89.7757"),
                },
            },
        });

        expect(routesNotIncludesResult.errors).toBeFalsy();
        expect((routesNotIncludesResult.data as any)[Route.plural]).toContainEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, height: null, crs: "wgs-84" })),
        });
    });

    test("enables query of a node with multiple wgs-84-3d points", async () => {
        const id = "dd320626-cc23-4938-9f33-ba624a3a3e8d";
        const waypoints = [...new Array(7)].map(() => ({
            longitude: parseFloat("146.1568"),
            latitude: parseFloat("-54.6132"),
            height: 0.03157347836531699,
        }));

        await testHelper.executeCypher(
            `
            CALL {
                CREATE (r:${Route})
                SET r.id = $id
                SET r.waypoints = [p in $waypoints | point(p)]
                RETURN r
            }

            RETURN r { .id, .waypoints } AS r
        `,
            { id, waypoints }
        );

        const routesQuery = /* GraphQL */ `
            query Routes($id: String!) {
                ${Route.plural}(where: { id: $id }) {
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

        const gqlResult = await testHelper.executeGraphQL(routesQuery, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Route.plural][0]).toEqual({
            id,
            waypoints: waypoints.map((waypoint) => ({ ...waypoint, crs: "wgs-84-3d" })),
        });
    });
});
