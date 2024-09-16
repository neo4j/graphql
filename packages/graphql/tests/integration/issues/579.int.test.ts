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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/pull/579", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    let Product: UniqueType;
    let Color: UniqueType;

    beforeAll(async () => {
        Product = testHelper.createUniqueType("Product");
        Color = testHelper.createUniqueType("Color");
        typeDefs = `
        type ${Product} {
           id: ID
           color: ${Color}! @relationship(type: "OF_COLOR", direction: OUT, properties: "OfColorProperties")
         }

         type OfColorProperties @relationshipProperties {
             test: Boolean
         }

         type ${Color} {
           name: String
           id: ID
         }
      `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should update an Edge property in a one to one relationship", async () => {
        const productId = generate({
            charset: "alphabetic",
        });

        const colorId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            mutation {
                ${Product.operations.update}(
                  where: { id: "${productId}" }
                  update: {
                      color: {
                          update: {
                              edge: {
                                  test: true
                              }
                          }
                      }
                  }
                ) {
                    ${Product.plural} {
                        id
                        colorConnection {
                            edges {
                                properties { 
                                    test
                                }
                            }
                        }
                    }
                }
              }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (product:${Product} {name: "Pringles", id: $productId})
                    CREATE (color:${Color} {name: "Yellow", id: $colorId})
                    MERGE (product)-[:OF_COLOR { test: false }]->(color)
            `,
            {
                productId,
                colorId,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {},
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data as any)[Product.operations.update][Product.plural][0]).toMatchObject({
            id: productId,
            colorConnection: {
                edges: [
                    {
                        properties: { test: true },
                    },
                ],
            },
        });
    });
});
