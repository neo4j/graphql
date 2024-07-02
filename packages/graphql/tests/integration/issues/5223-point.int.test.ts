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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5223, Point", () => {
    const testHelper = new TestHelper();

    let Location: UniqueType;
    const LondonPoint = { longitude: -0.127758, latitude: 51.507351 };
    const RomePoint = { longitude: 12.496365, latitude: 41.902782 };
    const ParisPoint = { longitude: 2.352222, latitude: 48.856613, height: 21 };

    beforeEach(async () => {
        Location = testHelper.createUniqueType("Location");

        const typeDefs = /* GraphQL */ `
            type ${Location} @node {
                id: ID!
                pointCoordinates: Point!
            }
        `;
        await testHelper.executeCypher(
            `
                    CREATE (:${Location} { id: "1", pointCoordinates: point($LondonPoint)})
                    CREATE (:${Location} { id: "2", pointCoordinates: point($RomePoint)})
                    CREATE (:${Location} { id: "3", pointCoordinates: point($ParisPoint)})
                `,
            { LondonPoint, RomePoint, ParisPoint }
        );
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not fail when srid is queried", async () => {
        const query = /* GraphQL */ `
            query {
                ${Location.plural} {
                        id
                        pointCoordinates {
                            latitude
                            longitude
                            height
                            crs
                            srid
                        }
                    }
            }
        `;

        const equalsResult = await testHelper.executeGraphQL(query);

        expect(equalsResult.errors).toBeFalsy();
        expect(equalsResult.data).toEqual({
            [Location.plural]: expect.toIncludeSameMembers([
                {
                    id: "1",
                    pointCoordinates: {
                        latitude: LondonPoint.latitude,
                        longitude: LondonPoint.longitude,
                        height: null,
                        crs: "wgs-84",
                        srid: 4326,
                    },
                },
                {
                    id: "2",
                    pointCoordinates: {
                        latitude: RomePoint.latitude,
                        longitude: RomePoint.longitude,
                        height: null,
                        crs: "wgs-84",
                        srid: 4326,
                    },
                },
                {
                    id: "3",
                    pointCoordinates: {
                        latitude: ParisPoint.latitude,
                        longitude: ParisPoint.longitude,
                        height: ParisPoint.height,
                        crs: "wgs-84-3d",
                        srid: 4979,
                    },
                },
            ]),
        });
    });

    test("should not fail when srid is queried, Connection", async () => {
        const query = /* GraphQL */ `
            query {
                ${Location.operations.connection} {
                    edges {
                        node {
                            id
                            pointCoordinates {
                                latitude
                                longitude
                                height
                                crs
                                srid
                            }
                        }
                    }
                }
            }
        `;

        const equalsResult = await testHelper.executeGraphQL(query);

        expect(equalsResult.errors).toBeFalsy();
        expect(equalsResult.data).toEqual({
            [Location.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            id: "1",
                            pointCoordinates: {
                                latitude: LondonPoint.latitude,
                                longitude: LondonPoint.longitude,
                                height: null,
                                crs: "wgs-84",
                                srid: 4326,
                            },
                        },
                    },
                    {
                        node: {
                            id: "2",
                            pointCoordinates: {
                                latitude: RomePoint.latitude,
                                longitude: RomePoint.longitude,
                                height: null,
                                crs: "wgs-84",
                                srid: 4326,
                            },
                        },
                    },
                    {
                        node: {
                            id: "3",
                            pointCoordinates: {
                                latitude: ParisPoint.latitude,
                                longitude: ParisPoint.longitude,
                                height: ParisPoint.height,
                                crs: "wgs-84-3d",
                                srid: 4979,
                            },
                        },
                    },
                ]),
            },
        });
    });

    test("should not fail when srid is not queried", async () => {
        const query = /* GraphQL */ `
            query {
                ${Location.plural} {
                        id
                        pointCoordinates {
                            latitude
                            longitude
                            height
                            crs
                        }
                    }
            }
        `;

        const equalsResult = await testHelper.executeGraphQL(query);

        expect(equalsResult.errors).toBeFalsy();
        expect(equalsResult.data).toEqual({
            [Location.plural]: expect.toIncludeSameMembers([
                {
                    id: "1",
                    pointCoordinates: {
                        latitude: LondonPoint.latitude,
                        longitude: LondonPoint.longitude,
                        height: null,
                        crs: "wgs-84",
                    },
                },
                {
                    id: "2",
                    pointCoordinates: {
                        latitude: RomePoint.latitude,
                        longitude: RomePoint.longitude,
                        height: null,
                        crs: "wgs-84",
                    },
                },
                {
                    id: "3",
                    pointCoordinates: {
                        latitude: ParisPoint.latitude,
                        longitude: ParisPoint.longitude,
                        height: ParisPoint.height,
                        crs: "wgs-84-3d",
                    },
                },
            ]),
        });
    });

    test("should not fail when srid is not queried, Connection", async () => {
        const query = /* GraphQL */ `
            query {
                ${Location.operations.connection} {
                    edges {
                        node {
                            id
                            pointCoordinates {
                                latitude
                                longitude
                                height
                                crs
                            }
                        }
                    }
                }
            }
        `;

        const equalsResult = await testHelper.executeGraphQL(query);

        expect(equalsResult.errors).toBeFalsy();
        expect(equalsResult.data).toEqual({
            [Location.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            id: "1",
                            pointCoordinates: {
                                latitude: LondonPoint.latitude,
                                longitude: LondonPoint.longitude,
                                height: null,
                                crs: "wgs-84",
                            },
                        },
                    },
                    {
                        node: {
                            id: "2",
                            pointCoordinates: {
                                latitude: RomePoint.latitude,
                                longitude: RomePoint.longitude,
                                height: null,
                                crs: "wgs-84",
                            },
                        },
                    },
                    {
                        node: {
                            id: "3",
                            pointCoordinates: {
                                latitude: ParisPoint.latitude,
                                longitude: ParisPoint.longitude,
                                height: ParisPoint.height,
                                crs: "wgs-84-3d",
                            },
                        },
                    },
                ]),
            },
        });
    });
});
