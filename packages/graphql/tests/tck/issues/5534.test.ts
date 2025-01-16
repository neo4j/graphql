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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5534", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Product
                @node
                @mutation(operations: [])
                @authorization(
                    filter: [
                        {
                            requireAuthentication: false
                            operations: [READ, AGGREGATE]
                            where: { AND: [{ node: { isPublic: { eq: true } } }, { node: { isEmpty: { eq: true } } }] }
                        }
                    ]
                )
                @subscription(events: []) {
                """
                Unique Identifier of this product
                """
                productId: Int!
                isEmpty: Boolean! @default(value: false)
                isPublic: Boolean! @default(value: false)
                """
                The product variants belonging to this product
                """
                variants: [Product!]!
                    @relationship(type: "PRODUCT_HAS_FAMILY_PRODUCT", direction: IN, nestedOperations: [])
                    @settable(onCreate: false, onUpdate: false)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should generate authorization for filter", async () => {
        const query = /* GraphQL */ `
            query {
                products(limit: 1, where: { variantsAggregate: { count: { eq: 1 } } }) {
                    productId
                    variantsAggregate {
                        count
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Product)
            CALL {
                WITH this
                MATCH (this)<-[this0:PRODUCT_HAS_FAMILY_PRODUCT]-(this1:Product|Banana)
                RETURN count(this1) = $param0 AS var2
            }
            WITH *
            WHERE (var2 = true AND (($param1 IS NOT NULL AND this.isPublic = $param1) AND ($param2 IS NOT NULL AND this.isEmpty = $param2)))
            WITH *
            LIMIT $param3
            CALL {
                WITH this
                MATCH (this)<-[this3:PRODUCT_HAS_FAMILY_PRODUCT]-(this4:Product)
                WHERE (($param4 IS NOT NULL AND this4.isPublic = $param4) AND ($param5 IS NOT NULL AND this4.isEmpty = $param5))
                RETURN count(this4) AS var5
            }
            RETURN this { .productId, variantsAggregate: { count: var5 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": true,
                \\"param2\\": true,
                \\"param3\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param4\\": true,
                \\"param5\\": true
            }"
        `);
    });
});
