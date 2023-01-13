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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2396", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type PostalCode @exclude(operations: [DELETE]) {
                archivedAt: DateTime
                number: String! @id(autogenerate: false)

                address: [Address!]! @relationship(type: "HAS_POSTAL_CODE", direction: IN)
            }

            extend type PostalCode @auth(rules: [{ where: { archivedAt: null } }])

            union AddressNode = Estate

            type Address @exclude(operations: [DELETE]) {
                archivedAt: DateTime
                uuid: ID! @id
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                address: String! @unique
                streetNumber: String
                route: String! @coalesce(value: "")
                postalCode: PostalCode! @relationship(type: "HAS_POSTAL_CODE", direction: OUT)
                locality: String! @coalesce(value: "")
                administrativeAreaLevel1: String! @coalesce(value: "")
                administrativeAreaLevel2: String
                country: String! @coalesce(value: "")
                location: Point!

                node: [AddressNode!]! @relationship(type: "HAS_ADDRESS", direction: IN)
            }

            extend type Address @auth(rules: [{ where: { archivedAt: null } }])

            type Mandate @exclude(operations: [DELETE]) {
                archivedAt: DateTime
                number: String! @unique # numéro
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                price: Float!

                valuation: Valuation! @relationship(type: "HAS_VALUATION", direction: OUT)
            }

            extend type Mandate @auth(rules: [{ where: { archivedAt: null } }])

            type Valuation @exclude(operations: [DELETE]) {
                archivedAt: DateTime
                uuid: ID! @id
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                estate: Estate @relationship(type: "VALUATION_FOR", direction: OUT)
            }

            extend type Valuation @auth(rules: [{ where: { archivedAt: null } }])

            enum EstateType {
                APARTMENT
                HOUSE_VILLA
                TOWNHOUSE
                LAND
                PARKING
                BOX
                BUILDING
                COMMERCIAL_PREMISE
                CHALET
                CASTLE
                OFFICE
                BUSINESS_FUND
            }

            type Estate @exclude(operations: [DELETE]) {
                archivedAt: DateTime
                uuid: ID! @id
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                estateType: EstateType!
                area: Float!
                floor: Int

                address: Address @relationship(type: "HAS_ADDRESS", direction: OUT)
            }

            extend type Estate @auth(rules: [{ where: { archivedAt: null } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("query should not contain skip or limit", async () => {
        const query = gql`
            query Mandates($where: MandateWhere, $options: MandateOptions) {
                mandates(options: $options, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            options: {},
            where: {
                price_GTE: 0,
                valuation: {
                    estate: {
                        address: {
                            postalCode: {
                                number_IN: ["13001"],
                            },
                        },
                        area_GTE: 0,
                        estateType_IN: ["APARTMENT"],
                        floor_GTE: 0,
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, { variableValues });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Mandate\`)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_VALUATION]->(this1:\`Valuation\`)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:VALUATION_FOR]->(this3:\`Estate\`)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:HAS_ADDRESS]->(this5:\`Address\`)
                        CALL {
                            WITH this5
                            MATCH (this5)-[this6:HAS_POSTAL_CODE]->(this7:\`PostalCode\`)
                            WHERE this7.number IN $param0
                            RETURN count(this6) AS var8
                        }
                        WITH *
                        WHERE var8 = 1
                        RETURN count(this4) AS var9
                    }
                    WITH *
                    WHERE (this3.area >= $param1 AND this3.floor >= $param2 AND this3.estateType IN $param3 AND var9 = 1)
                    RETURN count(this2) AS var10
                }
                WITH *
                WHERE var10 = 1
                RETURN count(this0) AS var11
            }
            WITH *
            WHERE ((this.price >= $param4 AND var11 = 1) AND this.archivedAt IS NULL)
            CALL {
                WITH this
                MATCH (this)-[this12:HAS_VALUATION]->(this_valuation:\`Valuation\`)
                WHERE this_valuation.archivedAt IS NULL
                CALL {
                    WITH this_valuation
                    MATCH (this_valuation)-[this13:VALUATION_FOR]->(this_valuation_estate:\`Estate\`)
                    WHERE this_valuation_estate.archivedAt IS NULL
                    WITH this_valuation_estate { .uuid } AS this_valuation_estate
                    RETURN head(collect(this_valuation_estate)) AS this_valuation_estate
                }
                WITH this_valuation { estate: this_valuation_estate } AS this_valuation
                RETURN head(collect(this_valuation)) AS this_valuation
            }
            RETURN this { valuation: this_valuation } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"13001\\"
                ],
                \\"param1\\": 0,
                \\"param2\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param3\\": [
                    \\"APARTMENT\\"
                ],
                \\"param4\\": 0
            }"
        `);
    });

    test("query should contain offset of 0 and limit of 20", async () => {
        const query = gql`
            query Mandates($where: MandateWhere, $options: MandateOptions) {
                mandates(options: $options, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            options: {
                offset: 0,
                limit: 20,
            },
            where: {
                price_GTE: 0,
                valuation: {
                    estate: {
                        address: {
                            postalCode: {
                                number_IN: ["13001"],
                            },
                        },
                        area_GTE: 0,
                        estateType_IN: ["APARTMENT"],
                        floor_GTE: 0,
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, { variableValues });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Mandate\`)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_VALUATION]->(this1:\`Valuation\`)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:VALUATION_FOR]->(this3:\`Estate\`)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:HAS_ADDRESS]->(this5:\`Address\`)
                        CALL {
                            WITH this5
                            MATCH (this5)-[this6:HAS_POSTAL_CODE]->(this7:\`PostalCode\`)
                            WHERE this7.number IN $param0
                            RETURN count(this6) AS var8
                        }
                        WITH *
                        WHERE var8 = 1
                        RETURN count(this4) AS var9
                    }
                    WITH *
                    WHERE (this3.area >= $param1 AND this3.floor >= $param2 AND this3.estateType IN $param3 AND var9 = 1)
                    RETURN count(this2) AS var10
                }
                WITH *
                WHERE var10 = 1
                RETURN count(this0) AS var11
            }
            WITH *
            WHERE ((this.price >= $param4 AND var11 = 1) AND this.archivedAt IS NULL)
            WITH *
            SKIP $param5
            LIMIT $param6
            CALL {
                WITH this
                MATCH (this)-[this12:HAS_VALUATION]->(this_valuation:\`Valuation\`)
                WHERE this_valuation.archivedAt IS NULL
                CALL {
                    WITH this_valuation
                    MATCH (this_valuation)-[this13:VALUATION_FOR]->(this_valuation_estate:\`Estate\`)
                    WHERE this_valuation_estate.archivedAt IS NULL
                    WITH this_valuation_estate { .uuid } AS this_valuation_estate
                    RETURN head(collect(this_valuation_estate)) AS this_valuation_estate
                }
                WITH this_valuation { estate: this_valuation_estate } AS this_valuation
                RETURN head(collect(this_valuation)) AS this_valuation
            }
            RETURN this { valuation: this_valuation } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"13001\\"
                ],
                \\"param1\\": 0,
                \\"param2\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param3\\": [
                    \\"APARTMENT\\"
                ],
                \\"param4\\": 0,
                \\"param5\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param6\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("query should contain offset of 20 and limit of 40", async () => {
        const query = gql`
            query Mandates($where: MandateWhere, $options: MandateOptions) {
                mandates(options: $options, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            options: {
                offset: 20,
                limit: 40,
            },
            where: {
                price_GTE: 0,
                valuation: {
                    estate: {
                        address: {
                            postalCode: {
                                number_IN: ["13001"],
                            },
                        },
                        area_GTE: 0,
                        estateType_IN: ["APARTMENT"],
                        floor_GTE: 0,
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, { variableValues });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Mandate\`)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_VALUATION]->(this1:\`Valuation\`)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:VALUATION_FOR]->(this3:\`Estate\`)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:HAS_ADDRESS]->(this5:\`Address\`)
                        CALL {
                            WITH this5
                            MATCH (this5)-[this6:HAS_POSTAL_CODE]->(this7:\`PostalCode\`)
                            WHERE this7.number IN $param0
                            RETURN count(this6) AS var8
                        }
                        WITH *
                        WHERE var8 = 1
                        RETURN count(this4) AS var9
                    }
                    WITH *
                    WHERE (this3.area >= $param1 AND this3.floor >= $param2 AND this3.estateType IN $param3 AND var9 = 1)
                    RETURN count(this2) AS var10
                }
                WITH *
                WHERE var10 = 1
                RETURN count(this0) AS var11
            }
            WITH *
            WHERE ((this.price >= $param4 AND var11 = 1) AND this.archivedAt IS NULL)
            WITH *
            SKIP $param5
            LIMIT $param6
            CALL {
                WITH this
                MATCH (this)-[this12:HAS_VALUATION]->(this_valuation:\`Valuation\`)
                WHERE this_valuation.archivedAt IS NULL
                CALL {
                    WITH this_valuation
                    MATCH (this_valuation)-[this13:VALUATION_FOR]->(this_valuation_estate:\`Estate\`)
                    WHERE this_valuation_estate.archivedAt IS NULL
                    WITH this_valuation_estate { .uuid } AS this_valuation_estate
                    RETURN head(collect(this_valuation_estate)) AS this_valuation_estate
                }
                WITH this_valuation { estate: this_valuation_estate } AS this_valuation
                RETURN head(collect(this_valuation)) AS this_valuation
            }
            RETURN this { valuation: this_valuation } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"13001\\"
                ],
                \\"param1\\": 0,
                \\"param2\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param3\\": [
                    \\"APARTMENT\\"
                ],
                \\"param4\\": 0,
                \\"param5\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                },
                \\"param6\\": {
                    \\"low\\": 40,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
