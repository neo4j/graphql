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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/6620", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Car
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
                producedBy: [CarManufacturer!]!
                    @relationship(type: "CAR_IS_PRODUCED_BY_CARMANUFACTURER", direction: IN, queryDirection: DIRECTED)
            }

            type CarManufacturer
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should only apply connection auth rule", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateCars(
                    where: { name: { eq: "x1" } }
                    update: { producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }] }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Car)
            WITH *
            WHERE this.name = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:CarManufacturer)
                    WHERE ((this0.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this0.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)) AND this0.name = $param2)
                    CREATE (this)<-[this1:CAR_IS_PRODUCED_BY_CARMANUFACTURER]-(this0)
                }
            }
            FINISH"
        `);
    });

    test("Should apply both update and connection auth rule", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateCars(
                    where: { name: { eq: "x1" } }
                    update: {
                        name: { set: "x2" }
                        producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }]
                    }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Car)
            WITH *
            WHERE (this.name = $param0 AND (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_UPDATE IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_UPDATE)))
            SET
                this.name = $param2
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:CarManufacturer)
                    WHERE ((this0.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this0.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)) AND this0.name = $param3)
                    CREATE (this)<-[this1:CAR_IS_PRODUCED_BY_CARMANUFACTURER]-(this0)
                }
            }
            FINISH"
        `);
    });
});

describe("https://github.com/neo4j/graphql/issues/6620 validate", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Car
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
                producedBy: [CarManufacturer!]!
                    @relationship(type: "CAR_IS_PRODUCED_BY_CARMANUFACTURER", direction: IN, queryDirection: DIRECTED)
            }

            type CarManufacturer
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should only apply connection auth rule", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateCars(
                    where: { name: { eq: "x1" } }
                    update: { producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }] }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Car)
            WITH *
            WHERE this.name = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:CarManufacturer)
                    WHERE this0.name = $param1
                    CALL apoc.util.validate(NOT (this0.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this0.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this)<-[this1:CAR_IS_PRODUCED_BY_CARMANUFACTURER]-(this0)
                    WITH *
                    CALL apoc.util.validate(NOT (this0.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this0.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_CREATE_RELATIONSHIP IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            FINISH"
        `);
    });

    test("Should apply both update and connection auth rule", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateCars(
                    where: { name: { eq: "x1" } }
                    update: {
                        name: { set: "x2" }
                        producedBy: [{ connect: { where: { node: { name: { eq: "BMW" } } } } }]
                    }
                ) {
                    info {
                        relationshipsCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Car)
            WITH *
            WHERE this.name = $param0
            WITH *
            CALL apoc.util.validate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_UPDATE IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_UPDATE)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.name = $param2
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:CarManufacturer)
                    WHERE this0.name = $param3
                    CALL apoc.util.validate(NOT (this0.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this0.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this)<-[this1:CAR_IS_PRODUCED_BY_CARMANUFACTURER]-(this0)
                    WITH *
                    CALL apoc.util.validate(NOT (this0.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this0.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_CREATE_RELATIONSHIP IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH *
            CALL apoc.util.validate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_UPDATE IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_UPDATE)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FINISH"
        `);
    });
});
