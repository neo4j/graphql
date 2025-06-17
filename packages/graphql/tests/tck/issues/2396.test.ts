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
            type PostalCode @mutation(operations: [CREATE, UPDATE]) @node {
                archivedAt: DateTime
                number: String!

                address: [Address!]! @relationship(type: "HAS_POSTAL_CODE", direction: IN)
            }

            extend type PostalCode @authorization(filter: [{ where: { node: { archivedAt: { eq: null } } } }])

            union AddressNode = Estate

            type Address @mutation(operations: [CREATE, UPDATE]) @node {
                archivedAt: DateTime
                uuid: ID! @id
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                address: String!
                streetNumber: String
                route: String! @coalesce(value: "")
                postalCode: [PostalCode!]! @relationship(type: "HAS_POSTAL_CODE", direction: OUT)
                locality: String! @coalesce(value: "")
                administrativeAreaLevel1: String! @coalesce(value: "")
                administrativeAreaLevel2: String
                country: String! @coalesce(value: "")
                location: Point!

                node: [AddressNode!]! @relationship(type: "HAS_ADDRESS", direction: IN)
            }

            extend type Address @authorization(filter: [{ where: { node: { archivedAt: { eq: null } } } }])

            type Mandate @mutation(operations: [CREATE, UPDATE]) @node {
                archivedAt: DateTime
                number: String!
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                price: Float!

                valuation: [Valuation!]! @relationship(type: "HAS_VALUATION", direction: OUT)
            }

            extend type Mandate @authorization(filter: [{ where: { node: { archivedAt: { eq: null } } } }])

            type Valuation @mutation(operations: [CREATE, UPDATE]) @node {
                archivedAt: DateTime
                uuid: ID! @id
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                estate: [Estate!]! @relationship(type: "VALUATION_FOR", direction: OUT)
            }

            extend type Valuation @authorization(filter: [{ where: { node: { archivedAt: { eq: null } } } }])

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

            type Estate @mutation(operations: [CREATE, UPDATE]) @node {
                archivedAt: DateTime
                uuid: ID! @id
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                estateType: EstateType!
                area: Float!
                floor: Int

                address: [Address!]! @relationship(type: "HAS_ADDRESS", direction: OUT)
            }

            extend type Estate @authorization(filter: [{ where: { node: { archivedAt: { eq: null } } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    test("nested relationship filter", async () => {
        const query = /* GraphQL */ `
            query Mandates($where: MandateWhere, $sort: [MandateSort!], $limit: Int, $offset: Int) {
                mandates(limit: $limit, offset: $offset, sort: $sort, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            sort: null,
            limit: null,
            offset: null,
            where: {
                valuation: {
                    some: {
                        estate: {
                            some: {
                                floor: { gte: 0 },
                            },
                        },
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Mandate)
            WITH *
            WHERE (EXISTS {
                MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
                WHERE EXISTS {
                    MATCH (this0)-[:VALUATION_FOR]->(this1:Estate)
                    WHERE this1.floor >= $param0
                }
            } AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            CALL (this) {
                MATCH (this)-[this2:HAS_VALUATION]->(this3:Valuation)
                WITH DISTINCT this3
                WITH *
                WHERE ($isAuthenticated = true AND this3.archivedAt IS NULL)
                CALL (this3) {
                    MATCH (this3)-[this4:VALUATION_FOR]->(this5:Estate)
                    WITH DISTINCT this5
                    WITH *
                    WHERE ($isAuthenticated = true AND this5.archivedAt IS NULL)
                    WITH this5 { .uuid } AS this5
                    RETURN collect(this5) AS var6
                }
                WITH this3 { estate: var6 } AS this3
                RETURN collect(this3) AS var7
            }
            RETURN this { valuation: var7 } AS this"
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
            query Mandates($where: MandateWhere, $sort: [MandateSort!], $limit: Int, $offset: Int) {
                mandates(limit: $limit, offset: $offset, sort: $sort, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            sort: null,
            limit: null,
            offset: null,
            where: {
                price: { gte: 0 },
                valuation: {
                    some: {
                        estate: {
                            some: {
                                floor: { gte: 0 },
                            },
                        },
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Mandate)
            WITH *
            WHERE ((this.price >= $param0 AND EXISTS {
                MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
                WHERE EXISTS {
                    MATCH (this0)-[:VALUATION_FOR]->(this1:Estate)
                    WHERE this1.floor >= $param1
                }
            }) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            CALL (this) {
                MATCH (this)-[this2:HAS_VALUATION]->(this3:Valuation)
                WITH DISTINCT this3
                WITH *
                WHERE ($isAuthenticated = true AND this3.archivedAt IS NULL)
                CALL (this3) {
                    MATCH (this3)-[this4:VALUATION_FOR]->(this5:Estate)
                    WITH DISTINCT this5
                    WITH *
                    WHERE ($isAuthenticated = true AND this5.archivedAt IS NULL)
                    WITH this5 { .uuid } AS this5
                    RETURN collect(this5) AS var6
                }
                WITH this3 { estate: var6 } AS this3
                RETURN collect(this3) AS var7
            }
            RETURN this { valuation: var7 } AS this"
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
            query Mandates($where: MandateWhere, $sort: [MandateSort!], $limit: Int, $offset: Int) {
                mandates(limit: $limit, offset: $offset, sort: $sort, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            sort: null,
            limit: null,
            offset: null,
            where: {
                price: { gte: 0 },
                valuation: {
                    some: {
                        estate: {
                            some: {
                                address: {
                                    some: {
                                        postalCode: {
                                            some: {
                                                number: { in: ["13001"] },
                                            },
                                        },
                                    },
                                },
                                area: { gte: 0 },
                                estateType: { in: ["APARTMENT"] },
                                floor: { gte: 0 },
                            },
                        },
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Mandate)
            WITH *
            WHERE ((this.price >= $param0 AND EXISTS {
                MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
                WHERE EXISTS {
                    MATCH (this0)-[:VALUATION_FOR]->(this1:Estate)
                    WHERE (this1.estateType IN $param1 AND this1.area >= $param2 AND this1.floor >= $param3 AND EXISTS {
                        MATCH (this1)-[:HAS_ADDRESS]->(this2:Address)
                        WHERE EXISTS {
                            MATCH (this2)-[:HAS_POSTAL_CODE]->(this3:PostalCode)
                            WHERE this3.number IN $param4
                        }
                    })
                }
            }) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            CALL (this) {
                MATCH (this)-[this4:HAS_VALUATION]->(this5:Valuation)
                WITH DISTINCT this5
                WITH *
                WHERE ($isAuthenticated = true AND this5.archivedAt IS NULL)
                CALL (this5) {
                    MATCH (this5)-[this6:VALUATION_FOR]->(this7:Estate)
                    WITH DISTINCT this7
                    WITH *
                    WHERE ($isAuthenticated = true AND this7.archivedAt IS NULL)
                    WITH this7 { .uuid } AS this7
                    RETURN collect(this7) AS var8
                }
                WITH this5 { estate: var8 } AS this5
                RETURN collect(this5) AS var9
            }
            RETURN this { valuation: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 0,
                \\"param1\\": [
                    \\"APARTMENT\\"
                ],
                \\"param2\\": 0,
                \\"param3\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param4\\": [
                    \\"13001\\"
                ],
                \\"isAuthenticated\\": true
            }"
        `);
    });

    test("query should contain offset of 0 and limit of 20", async () => {
        const query = /* GraphQL */ `
            query Mandates($where: MandateWhere, $sort: [MandateSort!], $limit: Int, $offset: Int) {
                mandates(limit: $limit, offset: $offset, sort: $sort, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            offset: 0,
            limit: 20,
            sort: null,
            where: {
                price: { gte: 0 },
                valuation: {
                    some: {
                        estate: {
                            some: {
                                address: {
                                    some: {
                                        postalCode: {
                                            some: {
                                                number: { in: ["13001"] },
                                            },
                                        },
                                    },
                                },
                                area: { gte: 0 },
                                estateType: { in: ["APARTMENT"] },
                                floor: { gte: 0 },
                            },
                        },
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Mandate)
            WITH *
            WHERE ((this.price >= $param0 AND EXISTS {
                MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
                WHERE EXISTS {
                    MATCH (this0)-[:VALUATION_FOR]->(this1:Estate)
                    WHERE (this1.estateType IN $param1 AND this1.area >= $param2 AND this1.floor >= $param3 AND EXISTS {
                        MATCH (this1)-[:HAS_ADDRESS]->(this2:Address)
                        WHERE EXISTS {
                            MATCH (this2)-[:HAS_POSTAL_CODE]->(this3:PostalCode)
                            WHERE this3.number IN $param4
                        }
                    })
                }
            }) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            WITH *
            SKIP $param6
            LIMIT $param7
            CALL (this) {
                MATCH (this)-[this4:HAS_VALUATION]->(this5:Valuation)
                WITH DISTINCT this5
                WITH *
                WHERE ($isAuthenticated = true AND this5.archivedAt IS NULL)
                CALL (this5) {
                    MATCH (this5)-[this6:VALUATION_FOR]->(this7:Estate)
                    WITH DISTINCT this7
                    WITH *
                    WHERE ($isAuthenticated = true AND this7.archivedAt IS NULL)
                    WITH this7 { .uuid } AS this7
                    RETURN collect(this7) AS var8
                }
                WITH this5 { estate: var8 } AS this5
                RETURN collect(this5) AS var9
            }
            RETURN this { valuation: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 0,
                \\"param1\\": [
                    \\"APARTMENT\\"
                ],
                \\"param2\\": 0,
                \\"param3\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param4\\": [
                    \\"13001\\"
                ],
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
            query Mandates($where: MandateWhere, $sort: [MandateSort!], $limit: Int, $offset: Int) {
                mandates(limit: $limit, offset: $offset, sort: $sort, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            offset: 20,
            limit: 40,
            sort: null,
            where: {
                price: { gte: 0 },
                valuation: {
                    some: {
                        estate: {
                            some: {
                                address: {
                                    some: {
                                        postalCode: {
                                            some: {
                                                number: { in: ["13001"] },
                                            },
                                        },
                                    },
                                },
                                area: { gte: 0 },
                                estateType: { in: ["APARTMENT"] },
                                floor: { gte: 0 },
                            },
                        },
                    },
                },
            },
        };

        const result = await translateQuery(neoSchema, query, {
            variableValues,
            contextValues: { token: createBearerToken("secret") },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Mandate)
            WITH *
            WHERE ((this.price >= $param0 AND EXISTS {
                MATCH (this)-[:HAS_VALUATION]->(this0:Valuation)
                WHERE EXISTS {
                    MATCH (this0)-[:VALUATION_FOR]->(this1:Estate)
                    WHERE (this1.estateType IN $param1 AND this1.area >= $param2 AND this1.floor >= $param3 AND EXISTS {
                        MATCH (this1)-[:HAS_ADDRESS]->(this2:Address)
                        WHERE EXISTS {
                            MATCH (this2)-[:HAS_POSTAL_CODE]->(this3:PostalCode)
                            WHERE this3.number IN $param4
                        }
                    })
                }
            }) AND ($isAuthenticated = true AND this.archivedAt IS NULL))
            WITH *
            SKIP $param6
            LIMIT $param7
            CALL (this) {
                MATCH (this)-[this4:HAS_VALUATION]->(this5:Valuation)
                WITH DISTINCT this5
                WITH *
                WHERE ($isAuthenticated = true AND this5.archivedAt IS NULL)
                CALL (this5) {
                    MATCH (this5)-[this6:VALUATION_FOR]->(this7:Estate)
                    WITH DISTINCT this7
                    WITH *
                    WHERE ($isAuthenticated = true AND this7.archivedAt IS NULL)
                    WITH this7 { .uuid } AS this7
                    RETURN collect(this7) AS var8
                }
                WITH this5 { estate: var8 } AS this5
                RETURN collect(this5) AS var9
            }
            RETURN this { valuation: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 0,
                \\"param1\\": [
                    \\"APARTMENT\\"
                ],
                \\"param2\\": 0,
                \\"param3\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param4\\": [
                    \\"13001\\"
                ],
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
