/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5223, Cartesian", () => {
    const testHelper = new TestHelper();

    let Location: UniqueType;
    const LondonPoint = { x: -14221.955504767046, y: 6711533.711877272 };
    const RomePoint = { x: 1391088.9885668862, y: 5146427.7652232265 };
    const ParisPoint = { x: 261848.15527273554, y: 6250566.54904563, z: 21 };

    beforeEach(async () => {
        Location = testHelper.createUniqueType("Location");

        const typeDefs = /* GraphQL */ `
            type ${Location} @node {
                id: ID!
                pointCoordinates: CartesianPoint!
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
                            x
                            y
                            z
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
                        y: LondonPoint.y,
                        x: LondonPoint.x,
                        z: null,
                        crs: "cartesian",
                        srid: 7203,
                    },
                },
                {
                    id: "2",
                    pointCoordinates: {
                        y: RomePoint.y,
                        x: RomePoint.x,
                        z: null,
                        crs: "cartesian",
                        srid: 7203,
                    },
                },
                {
                    id: "3",
                    pointCoordinates: {
                        y: ParisPoint.y,
                        x: ParisPoint.x,
                        z: ParisPoint.z,
                        crs: "cartesian-3d",
                        srid: 9157,
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
                                x
                                y
                                z
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
                                y: LondonPoint.y,
                                x: LondonPoint.x,
                                z: null,
                                crs: "cartesian",
                                srid: 7203,
                            },
                        },
                    },
                    {
                        node: {
                            id: "2",
                            pointCoordinates: {
                                y: RomePoint.y,
                                x: RomePoint.x,
                                z: null,
                                crs: "cartesian",
                                srid: 7203,
                            },
                        },
                    },
                    {
                        node: {
                            id: "3",
                            pointCoordinates: {
                                y: ParisPoint.y,
                                x: ParisPoint.x,
                                z: ParisPoint.z,
                                crs: "cartesian-3d",
                                srid: 9157,
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
                            x
                            y
                            z
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
                        y: LondonPoint.y,
                        x: LondonPoint.x,
                        z: null,
                        crs: "cartesian",
                    },
                },
                {
                    id: "2",
                    pointCoordinates: {
                        y: RomePoint.y,
                        x: RomePoint.x,
                        z: null,
                        crs: "cartesian",
                    },
                },
                {
                    id: "3",
                    pointCoordinates: {
                        y: ParisPoint.y,
                        x: ParisPoint.x,
                        z: ParisPoint.z,
                        crs: "cartesian-3d",
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
                                x
                                y
                                z
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
                                y: LondonPoint.y,
                                x: LondonPoint.x,
                                z: null,
                                crs: "cartesian",
                            },
                        },
                    },
                    {
                        node: {
                            id: "2",
                            pointCoordinates: {
                                y: RomePoint.y,
                                x: RomePoint.x,
                                z: null,
                                crs: "cartesian",
                            },
                        },
                    },
                    {
                        node: {
                            id: "3",
                            pointCoordinates: {
                                y: ParisPoint.y,
                                x: ParisPoint.x,
                                z: ParisPoint.z,
                                crs: "cartesian-3d",
                            },
                        },
                    },
                ]),
            },
        });
    });
});
