/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
        type ${Product} @node {
           id: ID
           color: [${Color}!]! @relationship(type: "OF_COLOR", direction: OUT, properties: "OfColorProperties")
         }

         type OfColorProperties @relationshipProperties {
             test: Boolean
         }

         type ${Color} @node {
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
                  where: { id_EQ: "${productId}" }
                  update: {
                      color: {
                          update: {
                              edge: {
                                  test_SET: true
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
