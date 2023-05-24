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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("#324", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Person {
                identifier: ID!
                car: Car! @relationship(type: "CAR", direction: OUT)
            }

            type Car {
                identifier: ID!
                manufacturer: Manufacturer! @relationship(type: "MANUFACTURER", direction: OUT)
            }

            type Manufacturer {
                identifier: ID!
                logo: Logo! @relationship(type: "LOGO", direction: OUT)
                name: String
            }

            type Logo {
                identifier: ID!
                name: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should have correct variables in apoc.do.when", async () => {
        const query = gql`
            mutation updatePeople($where: PersonWhere, $update: PersonUpdateInput) {
                updatePeople(where: $where, update: $update) {
                    people {
                        identifier
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: {
                where: { identifier: "Someone" },
                update: {
                    car: {
                        update: {
                            node: {
                                manufacturer: {
                                    update: {
                                        node: {
                                            name: "Manufacturer",
                                            logo: { connect: { where: { node: { identifier: "Opel Logo" } } } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Person\`)
            WHERE this.identifier = $param0
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_car0_relationship:CAR]->(this_car0:Car)
            	WITH this, this_car0
            	CALL {
            		WITH this, this_car0
            		MATCH (this_car0)-[this_car0_manufacturer0_relationship:MANUFACTURER]->(this_car0_manufacturer0:Manufacturer)
            		SET this_car0_manufacturer0.name = $this_update_car0_manufacturer0_name
            		WITH this, this_car0, this_car0_manufacturer0
            		CALL {
            			WITH this, this_car0, this_car0_manufacturer0
            			OPTIONAL MATCH (this_car0_manufacturer0_logo0_connect0_node:Logo)
            			WHERE this_car0_manufacturer0_logo0_connect0_node.identifier = $this_car0_manufacturer0_logo0_connect0_node_param0
            			CALL {
            				WITH *
            				WITH this, this_car0, collect(this_car0_manufacturer0_logo0_connect0_node) as connectedNodes, collect(this_car0_manufacturer0) as parentNodes
            				CALL {
            					WITH connectedNodes, parentNodes
            					UNWIND parentNodes as this_car0_manufacturer0
            					UNWIND connectedNodes as this_car0_manufacturer0_logo0_connect0_node
            					MERGE (this_car0_manufacturer0)-[:LOGO]->(this_car0_manufacturer0_logo0_connect0_node)
            					RETURN count(*) AS _
            				}
            				RETURN count(*) AS _
            			}
            		WITH this, this_car0, this_car0_manufacturer0, this_car0_manufacturer0_logo0_connect0_node
            			RETURN count(*) AS connect_this_car0_manufacturer0_logo0_connect_Logo
            		}
            		WITH this, this_car0, this_car0_manufacturer0
            		CALL {
            			WITH this_car0_manufacturer0
            			MATCH (this_car0_manufacturer0)-[this_car0_manufacturer0_logo_Logo_unique:LOGO]->(:Logo)
            			WITH count(this_car0_manufacturer0_logo_Logo_unique) as c
            			CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDManufacturer.logo required exactly once', [0])
            			RETURN c AS this_car0_manufacturer0_logo_Logo_unique_ignored
            		}
            		RETURN count(*) AS update_this_car0_manufacturer0
            	}
            	WITH this, this_car0
            	CALL {
            		WITH this_car0
            		MATCH (this_car0)-[this_car0_manufacturer_Manufacturer_unique:MANUFACTURER]->(:Manufacturer)
            		WITH count(this_car0_manufacturer_Manufacturer_unique) as c
            		CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDCar.manufacturer required exactly once', [0])
            		RETURN c AS this_car0_manufacturer_Manufacturer_unique_ignored
            	}
            	RETURN count(*) AS update_this_car0
            }
            WITH *
            CALL {
            	WITH this
            	MATCH (this)-[this_car_Car_unique:CAR]->(:Car)
            	WITH count(this_car_Car_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPerson.car required exactly once', [0])
            	RETURN c AS this_car_Car_unique_ignored
            }
            RETURN collect(DISTINCT this { .identifier }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Someone\\",
                \\"this_update_car0_manufacturer0_name\\": \\"Manufacturer\\",
                \\"this_car0_manufacturer0_logo0_connect0_node_param0\\": \\"Opel Logo\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
