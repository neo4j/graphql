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
                number: String! @unique
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
                MATCH (this)-[:\`HAS_VALUATION\`]->(this0:\`Valuation\`)
                CALL {
                    WITH this0
                    MATCH (this0)-[:\`VALUATION_FOR\`]->(this1:\`Estate\`)
                    CALL {
                        WITH this1
                        MATCH (this1)-[:\`HAS_ADDRESS\`]->(this2:\`Address\`)
                        MATCH (this2)-[:\`HAS_POSTAL_CODE\`]->(this3:\`PostalCode\`)
                        WITH *
                        WHERE this3.number IN $param0
                        RETURN count(this2) = 1 AS var4
                    }
                    WITH *
                    WHERE (this1.area >= $param1 AND this1.floor >= $param2 AND this1.estateType IN $param3 AND var4 = true)
                    RETURN count(this1) = 1 AS var5
                }
                WITH *
                WHERE var5 = true
                RETURN count(this0) = 1 AS var6
            }
            WITH *
            WHERE ((this.price >= $param4 AND var6 = true) AND this.archivedAt IS NULL)
            CALL {
                WITH this
                MATCH (this)-[this7:\`HAS_VALUATION\`]->(this8:\`Valuation\`)
                WHERE this8.archivedAt IS NULL
                CALL {
                    WITH this8
                    MATCH (this8)-[this9:\`VALUATION_FOR\`]->(this10:\`Estate\`)
                    WHERE this10.archivedAt IS NULL
                    WITH this10 { .uuid } AS this10
                    RETURN head(collect(this10)) AS var11
                }
                WITH this8 { estate: var11 } AS this8
                RETURN head(collect(this8)) AS var12
            }
            RETURN this { valuation: var12 } AS this"
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
                MATCH (this)-[:\`HAS_VALUATION\`]->(this0:\`Valuation\`)
                CALL {
                    WITH this0
                    MATCH (this0)-[:\`VALUATION_FOR\`]->(this1:\`Estate\`)
                    CALL {
                        WITH this1
                        MATCH (this1)-[:\`HAS_ADDRESS\`]->(this2:\`Address\`)
                        MATCH (this2)-[:\`HAS_POSTAL_CODE\`]->(this3:\`PostalCode\`)
                        WITH *
                        WHERE this3.number IN $param0
                        RETURN count(this2) = 1 AS var4
                    }
                    WITH *
                    WHERE (this1.area >= $param1 AND this1.floor >= $param2 AND this1.estateType IN $param3 AND var4 = true)
                    RETURN count(this1) = 1 AS var5
                }
                WITH *
                WHERE var5 = true
                RETURN count(this0) = 1 AS var6
            }
            WITH *
            WHERE ((this.price >= $param4 AND var6 = true) AND this.archivedAt IS NULL)
            WITH *
            SKIP $param5
            LIMIT $param6
            CALL {
                WITH this
                MATCH (this)-[this7:\`HAS_VALUATION\`]->(this8:\`Valuation\`)
                WHERE this8.archivedAt IS NULL
                CALL {
                    WITH this8
                    MATCH (this8)-[this9:\`VALUATION_FOR\`]->(this10:\`Estate\`)
                    WHERE this10.archivedAt IS NULL
                    WITH this10 { .uuid } AS this10
                    RETURN head(collect(this10)) AS var11
                }
                WITH this8 { estate: var11 } AS this8
                RETURN head(collect(this8)) AS var12
            }
            RETURN this { valuation: var12 } AS this"
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
                MATCH (this)-[:\`HAS_VALUATION\`]->(this0:\`Valuation\`)
                CALL {
                    WITH this0
                    MATCH (this0)-[:\`VALUATION_FOR\`]->(this1:\`Estate\`)
                    CALL {
                        WITH this1
                        MATCH (this1)-[:\`HAS_ADDRESS\`]->(this2:\`Address\`)
                        MATCH (this2)-[:\`HAS_POSTAL_CODE\`]->(this3:\`PostalCode\`)
                        WITH *
                        WHERE this3.number IN $param0
                        RETURN count(this2) = 1 AS var4
                    }
                    WITH *
                    WHERE (this1.area >= $param1 AND this1.floor >= $param2 AND this1.estateType IN $param3 AND var4 = true)
                    RETURN count(this1) = 1 AS var5
                }
                WITH *
                WHERE var5 = true
                RETURN count(this0) = 1 AS var6
            }
            WITH *
            WHERE ((this.price >= $param4 AND var6 = true) AND this.archivedAt IS NULL)
            WITH *
            SKIP $param5
            LIMIT $param6
            CALL {
                WITH this
                MATCH (this)-[this7:\`HAS_VALUATION\`]->(this8:\`Valuation\`)
                WHERE this8.archivedAt IS NULL
                CALL {
                    WITH this8
                    MATCH (this8)-[this9:\`VALUATION_FOR\`]->(this10:\`Estate\`)
                    WHERE this10.archivedAt IS NULL
                    WITH this10 { .uuid } AS this10
                    RETURN head(collect(this10)) AS var11
                }
                WITH this8 { estate: var11 } AS this8
                RETURN head(collect(this8)) AS var12
            }
            RETURN this { valuation: var12 } AS this"
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
