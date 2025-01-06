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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("[Point] - deprecated filter - deprecated", () => {
    const testHelper = new TestHelper();
    let Route: UniqueType;

    beforeEach(async () => {
        Route = testHelper.createUniqueType("Route");
        const typeDefs = /* GraphQL */ `
            type ${Route} @node {
                id: String!
                waypoints: [Point!]!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
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
                ${Route.plural}(where: { waypoints_EQ: $waypoints }) {
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
                ${Route.plural}(where: { id_EQ: $id }) {
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
