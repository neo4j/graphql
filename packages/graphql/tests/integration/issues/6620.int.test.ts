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

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6620", () => {
    let carType: UniqueType;
    let carManufacturerType: UniqueType;

    const testHelper = new TestHelper();
    const secret = "secret";

    beforeAll(async () => {
        carType = testHelper.createUniqueType("Car");
        carManufacturerType = testHelper.createUniqueType("CarManufacturer");

        const typeDefs = `
            type ${carType}
                @authorization(
                    filter: [
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_READ" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [AGGREGATE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_AGGREGATE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_UPDATE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_DELETE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [CREATE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_CREATE_RELATIONSHIP" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_DELETE_RELATIONSHIP" } } }
                                ]
                            }
                        }
                    ]
                )
                @node {
                name: String
                accessibleBy: String
                producedBy: [${carManufacturerType}!]!
                    @relationship(type: "CAR_IS_PRODUCED_BY_CARMANUFACTURER", direction: IN, queryDirection: DIRECTED)
            }

            type ${carManufacturerType}
                @authorization(
                    filter: [
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_CarManufacturer_node_READ" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [AGGREGATE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_CarManufacturer_node_AGGREGATE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_CarManufacturer_node_UPDATE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_CarManufacturer_node_DELETE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [CREATE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    {
                                        node: {
                                            accessibleBy: {
                                                in: "$jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    {
                                        node: {
                                            accessibleBy: {
                                                in: "$jwt.permission_CarManufacturer_node_DELETE_RELATIONSHIP"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                )
                @node {
                name: String
                accessibleBy: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
            CREATE (car:${carType}{name:"x1", accessibleBy:"test"})
            CREATE (m:${carManufacturerType}{name:"BMW", accessibleBy:"test"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should allow connect without property updates", async () => {
        const updateMutation = `
            mutation {
                ${carType.operations.update}(
                    where: { name: { eq: "x1" } }
                    update: { producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }] }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, {
            permission_Car_node_CREATE_RELATIONSHIP: "test",
            permission_CarManufacturer_node_CREATE_RELATIONSHIP: "test",
        });

        const updateResult = await testHelper.executeGraphQLWithToken(updateMutation, token);
        expect(updateResult.errors).toBeFalsy();
        expect(updateResult.data).toEqual({
            [carType.operations.update]: {
                info: { relationshipsCreated: 1 },
            },
        });
    });

    test("should not allow connect with property updates without update permission", async () => {
        const updateMutation = `
            mutation {
                ${carType.operations.update}(
                    where: { name: { eq: "x1" } }
                    update: { 
                      name:{set:"x2"},
                      producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }] }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, {
            permission_Car_node_CREATE_RELATIONSHIP: "test",
            permission_CarManufacturer_node_CREATE_RELATIONSHIP: "test",
        });

        const updateResult = await testHelper.executeGraphQLWithToken(updateMutation, token);
        expect(updateResult.errors).toBeFalsy();
        expect(updateResult.data).toEqual({
            [carType.operations.update]: {
                info: { relationshipsCreated: 0 },
            },
        });
    });

    test("should allow connect with property updates with update permission", async () => {
        const updateMutation = `
            mutation {
                ${carType.operations.update}(
                    where: { name: { eq: "x1" } }
                    update: { 
                      name:{set:"x2"},
                      producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }] }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, {
            permission_Car_node_CREATE_RELATIONSHIP: "test",
            permission_CarManufacturer_node_CREATE_RELATIONSHIP: "test",
            permission_Car_node_UPDATE: "test",
        });

        const updateResult = await testHelper.executeGraphQLWithToken(updateMutation, token);
        expect(updateResult.errors).toBeFalsy();
        expect(updateResult.data).toEqual({
            [carType.operations.update]: {
                info: { relationshipsCreated: 1 },
            },
        });
    });
});

describe("https://github.com/neo4j/graphql/issues/6620 validate", () => {
    let carType: UniqueType;
    let carManufacturerType: UniqueType;

    const testHelper = new TestHelper();
    const secret = "secret";

    beforeAll(async () => {
        carType = testHelper.createUniqueType("Car");
        carManufacturerType = testHelper.createUniqueType("CarManufacturer");

        const typeDefs = `
            type JWT @jwt {
                permission_Car_node_READ: [String!]!
                permission_Car_node_AGGREGATE: [String!]!
                permission_Car_node_UPDATE: [String!]!
                permission_Car_node_DELETE: [String!]!
                permission_Car_node_CREATE_RELATIONSHIP: [String!]!
                permission_Car_node_DELETE_RELATIONSHIP: [String!]!
                permission_CarManufacturer_node_READ: [String!]!
                permission_CarManufacturer_node_AGGREGATE: [String!]!
                permission_CarManufacturer_node_UPDATE: [String!]!
                permission_CarManufacturer_node_DELETE: [String!]!
                permission_CarManufacturer_node_CREATE_RELATIONSHIP: [String!]!
                permission_CarManufacturer_node_DELETE_RELATIONSHIP: [String!]!
            }

            type ${carType}
                @authorization(
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_READ" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [AGGREGATE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_AGGREGATE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_UPDATE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_DELETE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [CREATE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_CREATE_RELATIONSHIP" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_Car_node_DELETE_RELATIONSHIP" } } }
                                ]
                            }
                        }
                    ]
                )
                @node {
                name: String
                accessibleBy: String
                producedBy: [${carManufacturerType}!]!
                    @relationship(type: "CAR_IS_PRODUCED_BY_CARMANUFACTURER", direction: IN, queryDirection: DIRECTED)
            }

            type ${carManufacturerType}
                @authorization(
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_CarManufacturer_node_READ" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [AGGREGATE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_CarManufacturer_node_AGGREGATE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_CarManufacturer_node_UPDATE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    { node: { accessibleBy: { in: "$jwt.permission_CarManufacturer_node_DELETE" } } }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [CREATE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    {
                                        node: {
                                            accessibleBy: {
                                                in: "$jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { node: { accessibleBy: { eq: null } } }
                                    {
                                        node: {
                                            accessibleBy: {
                                                in: "$jwt.permission_CarManufacturer_node_DELETE_RELATIONSHIP"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                )
                @node {
                name: String
                accessibleBy: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
            CREATE (car:${carType}{name:"x1", accessibleBy:"test"})
            CREATE (m:${carManufacturerType}{name:"BMW", accessibleBy:"test"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should allow connect without property updates", async () => {
        const updateMutation = `
            mutation {
                ${carType.operations.update}(
                    where: { name: { eq: "x1" } }
                    update: { producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }] }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, {
            permission_Car_node_CREATE_RELATIONSHIP: "test",
            permission_CarManufacturer_node_CREATE_RELATIONSHIP: "test",
        });

        const updateResult = await testHelper.executeGraphQLWithToken(updateMutation, token);
        expect(updateResult.errors).toBeFalsy();
        expect(updateResult.data).toEqual({
            [carType.operations.update]: {
                info: { relationshipsCreated: 1 },
            },
        });
    });

    test("should not allow connect with property updates without update permission", async () => {
        const updateMutation = `
            mutation {
                ${carType.operations.update}(
                    where: { name: { eq: "x1" } }
                    update: { 
                      name:{set:"x2"},
                      producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }] }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, {
            permission_Car_node_CREATE_RELATIONSHIP: "test",
            permission_CarManufacturer_node_CREATE_RELATIONSHIP: "test",
        });

        const updateResult = await testHelper.executeGraphQLWithToken(updateMutation, token);
        expect(updateResult.errors?.[0]?.message).toBe("Forbidden");
        expect(updateResult.errors?.[0]).toBeInstanceOf(GraphQLError);
    });

    test("should allow connect with property updates with update permission", async () => {
        const updateMutation = `
            mutation {
                ${carType.operations.update}(
                    where: { name: { eq: "x1" } }
                    update: { 
                      name:{set:"x2"},
                      producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }] }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, {
            permission_Car_node_CREATE_RELATIONSHIP: "test",
            permission_CarManufacturer_node_CREATE_RELATIONSHIP: "test",
            permission_Car_node_UPDATE: "test",
        });

        const updateResult = await testHelper.executeGraphQLWithToken(updateMutation, token);
        expect(updateResult.errors).toBeFalsy();
        expect(updateResult.data).toEqual({
            [carType.operations.update]: {
                info: { relationshipsCreated: 1 },
            },
        });
    });
});
