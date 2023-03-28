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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/1756", () => {
    const productType = new UniqueType("Product");
    const genreType = new UniqueType("Genre");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = `
        interface INode {
            id: ID! @populatedBy(operations: [CREATE], callback: "nanoid")
        }

        type ${productType.name} implements INode {
            id: ID!
            name: String!
            genre: [${genreType.name}!]! @relationship(type: "HAS_GENRE", direction: OUT)
        }

        type ${genreType.name} implements INode {
            id: ID!
            value: String! @unique
        }
        `;

        const nanoid = () => {
            return `callback_value`;
        };

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver, features: { populatedBy: { callbacks: { nanoid } } } });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not raise a GraphQL validation error if invoked without passing the id field", async () => {
        const query = `
        mutation {
            ${productType.operations.create}(input: {
              name: "TestProduct",
              genre: {
                connectOrCreate: [
                  {
                    where: {
                      node: {
                        value: "Action"
                      }
                    },
                    onCreate: {
                      node: {
                        value: "Action"
                      }
                    }
                  }
                ]
              }
            }) {
              ${productType.plural} {
                id
              }
            }
          }
      `;

        const result = await graphql({
            schema,
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[productType.operations.create]).toEqual({
            [productType.plural]: [
                {
                    id: "callback_value",
                },
            ],
        });
    });
    test("should define the ID using the callback function", async () => {
        const query = `
      mutation {
          ${productType.operations.create}(input: {
            name: "TestProduct",
            genre: {
              connectOrCreate: [
                {
                  where: {
                    node: {
                      value: "Action"
                    }
                  },
                  onCreate: {
                    node: {
                      value: "Action"
                    }
                  }
                }
              ]
            }
          }) {
            ${productType.plural} {
              id
              name
              genre {
                  id
                  value
              }
            }
          }
        }
    `;

        const result = await graphql({
            schema,
            source: query,
            variableValues: {},
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result?.data?.[productType.operations.create]).toEqual({
            [productType.plural]: [
                {
                    id: "callback_value",
                    name: "TestProduct",
                    genre: [
                        {
                            id: "callback_value",
                            value: "Action",
                        },
                    ],
                },
            ],
        });
    });
});
