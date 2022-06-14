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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

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
            config: { enableRegex: true },
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
            "MATCH (this:Person)
            WHERE this.identifier = $this_identifier
            WITH this
            OPTIONAL MATCH (this)-[this_car0_relationship:CAR]->(this_car0:Car)
            CALL apoc.do.when(this_car0 IS NOT NULL, \\"
            WITH this, this_car0
            OPTIONAL MATCH (this_car0)-[this_car0_manufacturer0_relationship:MANUFACTURER]->(this_car0_manufacturer0:Manufacturer)
            CALL apoc.do.when(this_car0_manufacturer0 IS NOT NULL, \\\\\\"
            SET this_car0_manufacturer0.name = $this_update_car0_manufacturer0_name
            WITH this, this_car0, this_car0_manufacturer0
            CALL {
            	WITH this, this_car0, this_car0_manufacturer0
            	OPTIONAL MATCH (this_car0_manufacturer0_logo0_connect0_node:Logo)
            	WHERE this_car0_manufacturer0_logo0_connect0_node.identifier = $this_car0_manufacturer0_logo0_connect0_node_identifier
            	FOREACH(_ IN CASE this_car0_manufacturer0 WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_car0_manufacturer0_logo0_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this_car0_manufacturer0)-[:LOGO]->(this_car0_manufacturer0_logo0_connect0_node)
            		)
            	)
            	RETURN count(*) AS _
            }
            WITH this, this_car0, this_car0_manufacturer0
            CALL {
            	WITH this_car0_manufacturer0
            	MATCH (this_car0_manufacturer0)-[this_car0_manufacturer0_logo_Logo_unique:LOGO]->(:Logo)
            	WITH count(this_car0_manufacturer0_logo_Logo_unique) as c
            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDManufacturer.logo required', [0])
            	RETURN c AS this_car0_manufacturer0_logo_Logo_unique_ignored
            }
            RETURN count(*) AS _
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_car0:this_car0, updatePeople: $updatePeople, this_car0_manufacturer0:this_car0_manufacturer0, auth:$auth,this_update_car0_manufacturer0_name:$this_update_car0_manufacturer0_name,this_car0_manufacturer0_logo0_connect0_node_identifier:$this_car0_manufacturer0_logo0_connect0_node_identifier})
            YIELD value AS _
            WITH this, this_car0
            CALL {
            	WITH this_car0
            	MATCH (this_car0)-[this_car0_manufacturer_Manufacturer_unique:MANUFACTURER]->(:Manufacturer)
            	WITH count(this_car0_manufacturer_Manufacturer_unique) as c
            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDCar.manufacturer required', [0])
            	RETURN c AS this_car0_manufacturer_Manufacturer_unique_ignored
            }
            RETURN count(*) AS _
            \\", \\"\\", {this:this, updatePeople: $updatePeople, this_car0:this_car0, auth:$auth,this_update_car0_manufacturer0_name:$this_update_car0_manufacturer0_name,this_car0_manufacturer0_logo0_connect0_node_identifier:$this_car0_manufacturer0_logo0_connect0_node_identifier})
            YIELD value AS _
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_car_Car_unique:CAR]->(:Car)
            	WITH count(this_car_Car_unique) as c
            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPerson.car required', [0])
            	RETURN c AS this_car_Car_unique_ignored
            }
            RETURN collect(DISTINCT this { .identifier }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_identifier\\": \\"Someone\\",
                \\"this_update_car0_manufacturer0_name\\": \\"Manufacturer\\",
                \\"this_car0_manufacturer0_logo0_connect0_node_identifier\\": \\"Opel Logo\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                },
                \\"updatePeople\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"car\\": {
                                \\"update\\": {
                                    \\"node\\": {
                                        \\"manufacturer\\": {
                                            \\"update\\": {
                                                \\"node\\": {
                                                    \\"name\\": \\"Manufacturer\\",
                                                    \\"logo\\": {
                                                        \\"connect\\": {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"identifier\\": \\"Opel Logo\\"
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
