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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("579", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let typeDefs: string;
    let Product: UniqueType;
    let Color: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        Product = new UniqueType("Product");
        Color = new UniqueType("Color");
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
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should update an Edge property in a one to one relationship", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs });

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

        try {
            await session.run(
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: {},
                contextValue: neo4j.getContextValues(),
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
        } finally {
            await session.close();
        }
    });
});
