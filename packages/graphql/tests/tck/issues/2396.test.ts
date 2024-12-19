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
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2396", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type PostalCode @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                number: String! @unique

                address: [Address!]! @relationship(type: "HAS_POSTAL_CODE", direction: IN)
            }

            extend type PostalCode @authorization(filter: [{ where: { node: { archivedAt: null } } }])

            union AddressNode = Estate

            type Address @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                uuid: ID! @id @unique
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

            extend type Address @authorization(filter: [{ where: { node: { archivedAt: null } } }])

            type Mandate @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                number: String! @unique
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                price: Float!

                valuation: Valuation! @relationship(type: "HAS_VALUATION", direction: OUT)
            }

            extend type Mandate @authorization(filter: [{ where: { node: { archivedAt: null } } }])

            type Valuation @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                uuid: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                estate: Estate @relationship(type: "VALUATION_FOR", direction: OUT)
            }

            extend type Valuation @authorization(filter: [{ where: { node: { archivedAt: null } } }])

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

            type Estate @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                uuid: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                estateType: EstateType!
                area: Float!
                floor: Int

                address: Address @relationship(type: "HAS_ADDRESS", direction: OUT)
            }

            extend type Estate @authorization(filter: [{ where: { node: { archivedAt: null } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    test("nested relationship filter", async () => {
        const query = /* GraphQL */ `
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
                valuation: {
                    estate: {
                        floor_GTE: 0,
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Mandate)
            OPTIONAL MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
            WITH *, count(this0) AS var1
            WITH *
            WHERE ((var1 <> 0 AND single(this2 IN [(this0)-[:VALUATION_FOR]->(this2:Estate) WHERE this2.floor >= $param0 | 1] WHERE true)) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            CALL {
                WITH this
                MATCH (this)-[this3:HAS_VALUATION]->(this4:Valuation)
                WITH *
                WHERE ($isAuthenticated = true AND this4.archivedAt IS NULL)
                CALL {
                    WITH this4
                    MATCH (this4)-[this5:VALUATION_FOR]->(this6:Estate)
                    WITH *
                    WHERE ($isAuthenticated = true AND this6.archivedAt IS NULL)
                    WITH this6 { .uuid } AS this6
                    RETURN head(collect(this6)) AS var7
                }
                WITH this4 { estate: var7 } AS this4
                RETURN head(collect(this4)) AS var8
            }
            RETURN this { valuation: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"isAuthenticated\\": true
            }"
        `);
    });

    test("nested relationship filter with AND", async () => {
        const query = /* GraphQL */ `
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
                        floor_GTE: 0,
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Mandate)
            OPTIONAL MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
            WITH *, count(this0) AS var1
            WITH *
            WHERE ((this.price >= $param0 AND (var1 <> 0 AND single(this2 IN [(this0)-[:VALUATION_FOR]->(this2:Estate) WHERE this2.floor >= $param1 | 1] WHERE true))) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            CALL {
                WITH this
                MATCH (this)-[this3:HAS_VALUATION]->(this4:Valuation)
                WITH *
                WHERE ($isAuthenticated = true AND this4.archivedAt IS NULL)
                CALL {
                    WITH this4
                    MATCH (this4)-[this5:VALUATION_FOR]->(this6:Estate)
                    WITH *
                    WHERE ($isAuthenticated = true AND this6.archivedAt IS NULL)
                    WITH this6 { .uuid } AS this6
                    RETURN head(collect(this6)) AS var7
                }
                WITH this4 { estate: var7 } AS this4
                RETURN head(collect(this4)) AS var8
            }
            RETURN this { valuation: var8 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 0,
                \\"param1\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"isAuthenticated\\": true
            }"
        `);
    });

    test("query should not contain skip or limit", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Mandate)
            CALL {
                WITH this
                MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
                CALL {
                    WITH this0
                    MATCH (this0)-[:VALUATION_FOR]->(this1:Estate)
                    CALL {
                        WITH this1
                        MATCH (this1)-[:HAS_ADDRESS]->(this2:Address)
                        OPTIONAL MATCH (this2)-[:HAS_POSTAL_CODE]->(this3:PostalCode)
                        WITH *, count(this3) AS var4
                        WITH *
                        WHERE (var4 <> 0 AND this3.number IN $param0)
                        RETURN count(this2) = 1 AS var5
                    }
                    WITH *
                    WHERE (this1.estateType IN $param1 AND this1.area >= $param2 AND this1.floor >= $param3 AND var5 = true)
                    RETURN count(this1) = 1 AS var6
                }
                WITH *
                WHERE var6 = true
                RETURN count(this0) = 1 AS var7
            }
            WITH *
            WHERE ((this.price >= $param4 AND var7 = true) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            CALL {
                WITH this
                MATCH (this)-[this8:HAS_VALUATION]->(this9:Valuation)
                WITH *
                WHERE ($isAuthenticated = true AND this9.archivedAt IS NULL)
                CALL {
                    WITH this9
                    MATCH (this9)-[this10:VALUATION_FOR]->(this11:Estate)
                    WITH *
                    WHERE ($isAuthenticated = true AND this11.archivedAt IS NULL)
                    WITH this11 { .uuid } AS this11
                    RETURN head(collect(this11)) AS var12
                }
                WITH this9 { estate: var12 } AS this9
                RETURN head(collect(this9)) AS var13
            }
            RETURN this { valuation: var13 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"13001\\"
                ],
                \\"param1\\": [
                    \\"APARTMENT\\"
                ],
                \\"param2\\": 0,
                \\"param3\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param4\\": 0,
                \\"isAuthenticated\\": true
            }"
        `);
    });

    test("query should contain offset of 0 and limit of 20", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Mandate)
            CALL {
                WITH this
                MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
                CALL {
                    WITH this0
                    MATCH (this0)-[:VALUATION_FOR]->(this1:Estate)
                    CALL {
                        WITH this1
                        MATCH (this1)-[:HAS_ADDRESS]->(this2:Address)
                        OPTIONAL MATCH (this2)-[:HAS_POSTAL_CODE]->(this3:PostalCode)
                        WITH *, count(this3) AS var4
                        WITH *
                        WHERE (var4 <> 0 AND this3.number IN $param0)
                        RETURN count(this2) = 1 AS var5
                    }
                    WITH *
                    WHERE (this1.estateType IN $param1 AND this1.area >= $param2 AND this1.floor >= $param3 AND var5 = true)
                    RETURN count(this1) = 1 AS var6
                }
                WITH *
                WHERE var6 = true
                RETURN count(this0) = 1 AS var7
            }
            WITH *
            WHERE ((this.price >= $param4 AND var7 = true) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            WITH *
            SKIP $param6
            LIMIT $param7
            CALL {
                WITH this
                MATCH (this)-[this8:HAS_VALUATION]->(this9:Valuation)
                WITH *
                WHERE ($isAuthenticated = true AND this9.archivedAt IS NULL)
                CALL {
                    WITH this9
                    MATCH (this9)-[this10:VALUATION_FOR]->(this11:Estate)
                    WITH *
                    WHERE ($isAuthenticated = true AND this11.archivedAt IS NULL)
                    WITH this11 { .uuid } AS this11
                    RETURN head(collect(this11)) AS var12
                }
                WITH this9 { estate: var12 } AS this9
                RETURN head(collect(this9)) AS var13
            }
            RETURN this { valuation: var13 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"13001\\"
                ],
                \\"param1\\": [
                    \\"APARTMENT\\"
                ],
                \\"param2\\": 0,
                \\"param3\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param4\\": 0,
                \\"isAuthenticated\\": true,
                \\"param6\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param7\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("query should contain offset of 20 and limit of 40", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Mandate)
            CALL {
                WITH this
                MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
                CALL {
                    WITH this0
                    MATCH (this0)-[:VALUATION_FOR]->(this1:Estate)
                    CALL {
                        WITH this1
                        MATCH (this1)-[:HAS_ADDRESS]->(this2:Address)
                        OPTIONAL MATCH (this2)-[:HAS_POSTAL_CODE]->(this3:PostalCode)
                        WITH *, count(this3) AS var4
                        WITH *
                        WHERE (var4 <> 0 AND this3.number IN $param0)
                        RETURN count(this2) = 1 AS var5
                    }
                    WITH *
                    WHERE (this1.estateType IN $param1 AND this1.area >= $param2 AND this1.floor >= $param3 AND var5 = true)
                    RETURN count(this1) = 1 AS var6
                }
                WITH *
                WHERE var6 = true
                RETURN count(this0) = 1 AS var7
            }
            WITH *
            WHERE ((this.price >= $param4 AND var7 = true) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            WITH *
            SKIP $param6
            LIMIT $param7
            CALL {
                WITH this
                MATCH (this)-[this8:HAS_VALUATION]->(this9:Valuation)
                WITH *
                WHERE ($isAuthenticated = true AND this9.archivedAt IS NULL)
                CALL {
                    WITH this9
                    MATCH (this9)-[this10:VALUATION_FOR]->(this11:Estate)
                    WITH *
                    WHERE ($isAuthenticated = true AND this11.archivedAt IS NULL)
                    WITH this11 { .uuid } AS this11
                    RETURN head(collect(this11)) AS var12
                }
                WITH this9 { estate: var12 } AS this9
                RETURN head(collect(this9)) AS var13
            }
            RETURN this { valuation: var13 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"13001\\"
                ],
                \\"param1\\": [
                    \\"APARTMENT\\"
                ],
                \\"param2\\": 0,
                \\"param3\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param4\\": 0,
                \\"isAuthenticated\\": true,
                \\"param6\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                },
                \\"param7\\": {
                    \\"low\\": 40,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
