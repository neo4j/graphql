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
            WHERE this.name = $param0
            WITH *
            CALL(*) {
            	WITH this
            	OPTIONAL MATCH (this_producedBy0_connect0_node:CarManufacturer)
            	WHERE this_producedBy0_connect0_node.name = $this_producedBy0_connect0_node_param0 AND ((this_producedBy0_connect0_node.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this_producedBy0_connect0_node.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)) AND (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_CREATE_RELATIONSHIP IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_CREATE_RELATIONSHIP)))
            	CALL(*) {
            		WITH collect(this_producedBy0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL(connectedNodes, parentNodes) {
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_producedBy0_connect0_node
            			CREATE (this)<-[:CAR_IS_PRODUCED_BY_CARMANUFACTURER]-(this_producedBy0_connect0_node)
            		}
            	}
            WITH this, this_producedBy0_connect0_node
            	RETURN count(*) AS connect_this_producedBy0_connect_CarManufacturer0
            }
            RETURN \\"Query cannot conclude with CALL\\""
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
            SET this.name = $this_update_name.set
            WITH *
            CALL(*) {
            	WITH this
            	OPTIONAL MATCH (this_producedBy0_connect0_node:CarManufacturer)
            	WHERE this_producedBy0_connect0_node.name = $this_producedBy0_connect0_node_param0 AND ((this_producedBy0_connect0_node.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this_producedBy0_connect0_node.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)) AND (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_CREATE_RELATIONSHIP IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_CREATE_RELATIONSHIP)))
            	CALL(*) {
            		WITH collect(this_producedBy0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL(connectedNodes, parentNodes) {
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_producedBy0_connect0_node
            			CREATE (this)<-[:CAR_IS_PRODUCED_BY_CARMANUFACTURER]-(this_producedBy0_connect0_node)
            		}
            	}
            WITH this, this_producedBy0_connect0_node
            	RETURN count(*) AS connect_this_producedBy0_connect_CarManufacturer0
            }
            RETURN \\"Query cannot conclude with CALL\\""
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
            WHERE this.name = $param0
            WITH *
            CALL(*) {
            	WITH this
            	OPTIONAL MATCH (this_producedBy0_connect0_node:CarManufacturer)
            	WHERE this_producedBy0_connect0_node.name = $this_producedBy0_connect0_node_param0 AND (apoc.util.validatePredicate(NOT (this_producedBy0_connect0_node.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this_producedBy0_connect0_node.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_CREATE_RELATIONSHIP IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	CALL(*) {
            		WITH collect(this_producedBy0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL(connectedNodes, parentNodes) {
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_producedBy0_connect0_node
            			CREATE (this)<-[:CAR_IS_PRODUCED_BY_CARMANUFACTURER]-(this_producedBy0_connect0_node)
            		}
            	}
            WITH this, this_producedBy0_connect0_node
            WITH this, this_producedBy0_connect0_node
            WHERE (apoc.util.validatePredicate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_CREATE_RELATIONSHIP IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (this_producedBy0_connect0_node.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this_producedBy0_connect0_node.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this_producedBy0_connect_CarManufacturer0
            }
            RETURN \\"Query cannot conclude with CALL\\""
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
            WHERE (this.name = $param0 AND apoc.util.validatePredicate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_UPDATE IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_UPDATE)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            SET this.name = $this_update_name.set
            WITH *
            CALL(*) {
            	WITH this
            	OPTIONAL MATCH (this_producedBy0_connect0_node:CarManufacturer)
            	WHERE this_producedBy0_connect0_node.name = $this_producedBy0_connect0_node_param0 AND (apoc.util.validatePredicate(NOT (this_producedBy0_connect0_node.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this_producedBy0_connect0_node.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_CREATE_RELATIONSHIP IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	CALL(*) {
            		WITH collect(this_producedBy0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL(connectedNodes, parentNodes) {
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_producedBy0_connect0_node
            			CREATE (this)<-[:CAR_IS_PRODUCED_BY_CARMANUFACTURER]-(this_producedBy0_connect0_node)
            		}
            	}
            WITH this, this_producedBy0_connect0_node
            WITH this, this_producedBy0_connect0_node
            WHERE (apoc.util.validatePredicate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_CREATE_RELATIONSHIP IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (this_producedBy0_connect0_node.accessibleBy IS NULL OR ($jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP IS NOT NULL AND this_producedBy0_connect0_node.accessibleBy IN $jwt.permission_CarManufacturer_node_CREATE_RELATIONSHIP)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this_producedBy0_connect_CarManufacturer0
            }
            WITH this
            WHERE apoc.util.validatePredicate(NOT (this.accessibleBy IS NULL OR ($jwt.permission_Car_node_UPDATE IS NOT NULL AND this.accessibleBy IN $jwt.permission_Car_node_UPDATE)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN \\"Query cannot conclude with CALL\\""
        `);
    });
});
