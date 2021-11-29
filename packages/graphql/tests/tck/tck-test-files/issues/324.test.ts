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
import { createJwtRequest } from "../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("#324", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Person {
                identifier: ID!
                car: Car @relationship(type: "CAR", direction: OUT)
            }

            type Car {
                identifier: ID!
                manufacturer: Manufacturer @relationship(type: "MANUFACTURER", direction: OUT)
            }

            type Manufacturer {
                identifier: ID!
                logo: Logo @relationship(type: "LOGO", direction: OUT)
                name: String
            }

            type Logo {
                identifier: ID!
                name: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            WITH this
            OPTIONAL MATCH (this)-[this_car0_relationship:CAR]->(this_car0:Car)
            CALL apoc.do.when(this_car0 IS NOT NULL, \\"
            WITH this, this_car0, this_car0_relationship
            WITH this, this_car0, this_car0_relationship
            OPTIONAL MATCH (this_car0)-[this_car0_manufacturer0_relationship:MANUFACTURER]->(this_car0_manufacturer0:Manufacturer)
            CALL apoc.do.when(this_car0_manufacturer0 IS NOT NULL, \\\\\\"
            SET this_car0_manufacturer0.name = $this_update_car0_manufacturer0_name
            WITH this, this_car0, this_car0_relationship, this_car0_manufacturer0, this_car0_manufacturer0_relationship
            WITH this, this_car0, this_car0_relationship, this_car0_manufacturer0, this_car0_manufacturer0_relationship
            CALL {
            WITH this, this_car0, this_car0_relationship, this_car0_manufacturer0, this_car0_manufacturer0_relationship
            	OPTIONAL MATCH (this_car0_manufacturer0_logo0_connect0_node:Logo)
            	WHERE this_car0_manufacturer0_logo0_connect0_node.identifier = $this_car0_manufacturer0_logo0_connect0_node_identifier
            CALL apoc.do.when(this_car0_manufacturer0_logo0_connect0_node IS NOT NULL AND this_car0_manufacturer0 IS NOT NULL, \\\\\\"
            			MERGE (this_car0_manufacturer0)-[:LOGO]->(this_car0_manufacturer0_logo0_connect0_node)
            RETURN this, this_car0, this_car0_relationship, this_car0_manufacturer0, this_car0_manufacturer0_relationship, this_car0_manufacturer0_logo0_connect0_node, [ metaVal IN [{type: 'Connected', name: 'Manufacturer', relationshipName: 'LOGO', toName: 'Logo', id: id(this_car0_manufacturer0), toID: id(this_car0_manufacturer0_logo0_connect0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_car0_manufacturer0_logo0_connect0_node_mutateMeta
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_car0:this_car0, this_car0_relationship:this_car0_relationship, this_car0_manufacturer0:this_car0_manufacturer0, this_car0_manufacturer0_relationship:this_car0_manufacturer0_relationship, this_car0_manufacturer0_logo0_connect0_node:this_car0_manufacturer0_logo0_connect0_node})
            YIELD value
            WITH this, this_car0, this_car0_relationship, this_car0_manufacturer0, this_car0_manufacturer0_relationship, this_car0_manufacturer0_logo0_connect0_node, value.this_car0_manufacturer0_logo0_connect0_node_mutateMeta as this_car0_manufacturer0_logo0_connect_mutateMeta
            RETURN REDUCE(tmp1_this_car0_manufacturer0_logo0_connect_mutateMeta = [], tmp2_this_car0_manufacturer0_logo0_connect_mutateMeta IN COLLECT(this_car0_manufacturer0_logo0_connect_mutateMeta) | tmp1_this_car0_manufacturer0_logo0_connect_mutateMeta + tmp2_this_car0_manufacturer0_logo0_connect_mutateMeta) as this_car0_manufacturer0_logo0_connect_mutateMeta
            }
            WITH this, this_car0, this_car0_relationship, this_car0_manufacturer0, this_car0_manufacturer0_relationship, this_car0_manufacturer0_logo0_connect_mutateMeta as mutateMeta
            RETURN this, this_car0, this_car0_relationship, this_car0_manufacturer0, this_car0_manufacturer0_relationship, mutateMeta + [ metaVal IN [{type: 'Updated', name: 'Manufacturer', id: id(this_car0_manufacturer0), properties: $this_update_car0_manufacturer0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_car0:this_car0, this_car0_relationship:this_car0_relationship, this_car0_manufacturer0:this_car0_manufacturer0, this_car0_manufacturer0_relationship:this_car0_manufacturer0_relationship, updatePeople: $updatePeople, this_car0_manufacturer0:this_car0_manufacturer0, auth:$auth,this_update_car0_manufacturer0_name:$this_update_car0_manufacturer0_name,this_car0_manufacturer0_logo0_connect0_node_identifier:$this_car0_manufacturer0_logo0_connect0_node_identifier,this_update_car0_manufacturer0:$this_update_car0_manufacturer0})
            YIELD value
            WITH this, this_car0, this_car0_relationship, this_car0_manufacturer0, this_car0_manufacturer0_relationship, value.mutateMeta as mutateMeta
            RETURN this, this_car0, this_car0_relationship, mutateMeta
            \\", \\"\\", {this:this, this_car0:this_car0, this_car0_relationship:this_car0_relationship, updatePeople: $updatePeople, this_car0:this_car0, auth:$auth,this_update_car0_manufacturer0_name:$this_update_car0_manufacturer0_name,this_car0_manufacturer0_logo0_connect0_node_identifier:$this_car0_manufacturer0_logo0_connect0_node_identifier,this_update_car0_manufacturer0:$this_update_car0_manufacturer0})
            YIELD value
            WITH this, this_car0, this_car0_relationship, value.mutateMeta as mutateMeta
            RETURN mutateMeta, this { .identifier } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_identifier\\": \\"Someone\\",
                \\"this_update_car0_manufacturer0_name\\": \\"Manufacturer\\",
                \\"this_car0_manufacturer0_logo0_connect0_node_identifier\\": \\"Opel Logo\\",
                \\"this_update_car0_manufacturer0\\": {
                    \\"name\\": \\"Manufacturer\\"
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
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
                }
            }"
        `);
    });
});
