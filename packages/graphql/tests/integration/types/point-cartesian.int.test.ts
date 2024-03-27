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

describe("CartesianPoint", () => {
    const testHelper = new TestHelper();

    let Part: UniqueType;

    beforeEach(async () => {
        Part = testHelper.createUniqueType("Part");
        const typeDefs = /* GraphQL */ `
            type ${Part} {
                serial: String!
                location: CartesianPoint!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("enables creation of a node with a cartesian point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();

        const create = /* GraphQL */ `
            mutation CreateParts($serial: String!, $x: Float!, $y: Float!) {
                ${Part.operations.create}(input: [{ serial: $serial, location: { x: $x, y: $y } }]) {
                    ${Part.plural} {
                        serial
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
        const gqlResult = await testHelper.executeGraphQL(create, {
            variableValues: { serial, x, y },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.operations.create][Part.plural][0]).toEqual({
            serial,
            location: {
                x,
                y,
                z: null,
                crs: "cartesian",
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (p:${Part} {serial: "${serial}"})
                RETURN p { .serial, .location} as p
            `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(x);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(y);
        expect((result.records[0] as any).toObject().p.location.srid).toEqual(int(7203));
    });

    test("enables creation of a node with a cartesian-3d point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();
        const z = faker.number.float();

        const create = /* GraphQL */ `
            mutation CreateParts($serial: String!, $x: Float!, $y: Float!, $z: Float!) {
                ${Part.operations.create}(input: [{ serial: $serial, location: { x: $x, y: $y, z: $z } }]) {
                    ${Part.plural} {
                        serial
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
        const gqlResult = await testHelper.executeGraphQL(create, {
            variableValues: { serial, x, y, z },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.operations.create][Part.plural][0]).toEqual({
            serial,
            location: {
                x,
                y,
                z,
                crs: "cartesian-3d",
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (p:${Part} {serial: "${serial}"})
                RETURN p { .serial, .location} as p
            `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(x);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(y);
        expect((result.records[0] as any).toObject().p.location.z).toEqual(z);
        expect((result.records[0] as any).toObject().p.location.srid).toEqual(int(9157));
    });

    test("enables update of a node with a cartesian point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();
        const newY = faker.number.float();

        const beforeResult = await testHelper.executeCypher(`
            CALL {
                CREATE (p:${Part})
                SET p.serial = "${serial}"
                SET p.location = point({x: ${x}, y: ${y}})
                RETURN p
            }

            RETURN p { .serial, .location } AS p
        `);

        expect((beforeResult.records[0] as any).toObject().p.location.x).toEqual(x);
        expect((beforeResult.records[0] as any).toObject().p.location.y).toEqual(y);

        const update = /* GraphQL */ `
            mutation UpdateParts($serial: String!, $x: Float!, $y: Float!) {
                ${Part.operations.update}(where: { serial: $serial }, update: { location: { x: $x, y: $y } }) {
                    ${Part.plural} {
                        serial
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

        const gqlResult = await testHelper.executeGraphQL(update, {
            variableValues: { serial, x, y: newY },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.operations.update][Part.plural][0]).toEqual({
            serial,
            location: {
                x,
                y: newY,
                z: null,
                crs: "cartesian",
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (p:${Part} {serial: "${serial}"})
                RETURN p { .serial, .location} as p
            `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(x);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(newY);
        expect((result.records[0] as any).toObject().p.location.srid).toEqual(int(7203));
    });

    test("enables update of a node with a cartesian-3d point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();
        const z = faker.number.float();
        const newY = faker.number.float();

        const beforeResult = await testHelper.executeCypher(`
            CALL {
                CREATE (p:${Part})
                SET p.serial = "${serial}"
                SET p.location = point({x: ${x}, y: ${y}, z: ${z}})
                RETURN p
            }

            RETURN p { .serial, .location } AS p
        `);

        expect((beforeResult.records[0] as any).toObject().p.location.x).toEqual(x);
        expect((beforeResult.records[0] as any).toObject().p.location.y).toEqual(y);
        expect((beforeResult.records[0] as any).toObject().p.location.z).toEqual(z);

        const update = /* GraphQL */ `
            mutation UpdateParts($serial: String!, $x: Float!, $y: Float!, $z: Float!) {
                ${Part.operations.update}(where: { serial: $serial }, update: { location: { x: $x, y: $y, z: $z } }) {
                    ${Part.plural} {
                        serial
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

        const gqlResult = await testHelper.executeGraphQL(update, {
            variableValues: { serial, x, y: newY, z },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.operations.update][Part.plural][0]).toEqual({
            serial,
            location: {
                x,
                y: newY,
                z,
                crs: "cartesian-3d",
            },
        });

        const result = await testHelper.executeCypher(`
                MATCH (p:${Part} {serial: "${serial}"})
                RETURN p { .serial, .location} as p
            `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(x);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(newY);
        expect((result.records[0] as any).toObject().p.location.z).toEqual(z);
        expect((result.records[0] as any).toObject().p.location.srid).toEqual(int(9157));
    });

    test("enables query of a node with a cartesian point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();

        const result = await testHelper.executeCypher(`
            CALL {
                CREATE (p:${Part})
                SET p.serial = "${serial}"
                SET p.location = point({x: ${x}, y: ${y}})
                RETURN p
            }

            RETURN p { .id, .location } AS p
        `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(x);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(y);

        const partsQuery = /* GraphQL */ `
            query Parts($serial: String!) {
                ${Part.plural}(where: { serial: $serial }) {
                    serial
                    location {
                        x
                        y
                        z
                        crs
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(partsQuery, {
            variableValues: { serial },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.plural][0]).toEqual({
            serial,
            location: {
                x,
                y,
                z: null,
                crs: "cartesian",
            },
        });
    });

    test("enables query of a node with a cartesian-3d point", async () => {
        const serial = faker.string.uuid();
        const x = faker.number.float();
        const y = faker.number.float();
        const z = faker.number.float();

        const result = await testHelper.executeCypher(`
            CALL {
                CREATE (p:${Part})
                SET p.serial = "${serial}"
                SET p.location = point({x: ${x}, y: ${y}, z: ${z}})
                RETURN p
            }

            RETURN p { .id, .location } AS p
        `);

        expect((result.records[0] as any).toObject().p.location.x).toEqual(x);
        expect((result.records[0] as any).toObject().p.location.y).toEqual(y);
        expect((result.records[0] as any).toObject().p.location.z).toEqual(z);

        const partsQuery = /* GraphQL */ `
            query Parts($serial: String!) {
                ${Part.plural}(where: { serial: $serial }) {
                    serial
                    location {
                        x
                        y
                        z
                        crs
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(partsQuery, {
            variableValues: { serial },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[Part.plural][0]).toEqual({
            serial,
            location: {
                x,
                y,
                z,
                crs: "cartesian-3d",
            },
        });
    });
});
