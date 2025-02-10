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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5534", () => {
    const testHelper = new TestHelper();

    const secret = "secret";

    let Product: UniqueType;

    beforeAll(async () => {
        Product = testHelper.createUniqueType("Product");

        const typeDefs = /* GraphQL */ `
            type ${Product}
                @node
                @mutation(operations: [])
                @authorization(
                    filter: [
                        {
                            requireAuthentication: false
                            operations: [READ, AGGREGATE]
                            where: { AND: [{ node: { isPublic: { eq: true } } }, { node: { isEmpty: { eq: false } } }] }
                        }
                    ]
                )
                @subscription(events: []) {
                """
                Unique Identifier of this product
                """
                productId: String!
                isEmpty: Boolean! @default(value: false)
                isPublic: Boolean! @default(value: false)
                """
                The product variants belonging to this product
                """
                variants: [${Product}!]!
                    @relationship(
                        type: "PRODUCT_HAS_FAMILY_PRODUCT"
                        direction: IN
                        nestedOperations: []
                    )
                    @settable(onCreate: false, onUpdate: false)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("result with aggregate filter should match results from selection set", async () => {
        await testHelper.executeCypher(`
            CREATE (a:${Product} { productId: "A", isEmpty: false, isPublic: true })
            CREATE (b:${Product} { productId: "B", isEmpty: false, isPublic: true })
            CREATE (c:${Product} { productId: "C", isEmpty: true, isPublic: true })
            CREATE (a)-[:PRODUCT_HAS_FAMILY_PRODUCT]->(b)
            CREATE (a)-[:PRODUCT_HAS_FAMILY_PRODUCT]->(c)
        `);

        const token = createBearerToken(secret, { sub: "sub" });

        const productsQuery = /* GraphQL */ `
            query {
                ${Product.plural} {
                    productId
                    isEmpty
                    isPublic
                }
            }
        `;

        const productsResponse = await testHelper.executeGraphQLWithToken(productsQuery, token);

        expect(productsResponse.errors).toBeFalsy();
        expect(productsResponse.data).toEqual({
            [Product.plural]: expect.toIncludeSameMembers([
                { productId: "A", isEmpty: false, isPublic: true },
                { productId: "B", isEmpty: false, isPublic: true },
            ]),
        });

        const productsAndVariantsQuery = /* GraphQL */ `
            query {
                ${Product.plural} {
                    productId
                    isEmpty
                    isPublic
                    variants {
                        productId
                        isEmpty
                        isPublic
                    }
                }
            }
        `;

        const productsAndVariantsResponse = await testHelper.executeGraphQLWithToken(productsAndVariantsQuery, token);

        expect(productsAndVariantsResponse.errors).toBeFalsy();
        expect(productsAndVariantsResponse.data).toEqual({
            [Product.plural]: expect.toIncludeSameMembers([
                {
                    productId: "A",
                    isEmpty: false,
                    isPublic: true,
                    variants: [],
                },
                {
                    productId: "B",
                    isEmpty: false,
                    isPublic: true,
                    variants: [{ productId: "A", isEmpty: false, isPublic: true }],
                },
            ]),
        });

        const filteredProductsAndVariantsQuery = /* GraphQL */ `
            query {
                ${Product.plural}(where: { variantsAggregate: { count: { eq: 1 } } }) {
                    productId
                    variantsAggregate {
                        count
                    }
                }
            }
        `;

        const filteredProductsAndVariantsResponse = await testHelper.executeGraphQLWithToken(
            filteredProductsAndVariantsQuery,
            token
        );

        expect(filteredProductsAndVariantsResponse.errors).toBeFalsy();
        expect(filteredProductsAndVariantsResponse.data).toEqual({
            [Product.plural]: expect.toIncludeSameMembers([{ productId: "B", variantsAggregate: { count: 1 } }]),
        });
    });
});
