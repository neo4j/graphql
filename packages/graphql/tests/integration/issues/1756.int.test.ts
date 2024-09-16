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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1756", () => {
    let productType: UniqueType;
    let genreType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        productType = testHelper.createUniqueType("Product");
        genreType = testHelper.createUniqueType("Genre");
        const typeDefs = `
        interface INode {
            id: ID! 
        }

        type ${productType.name} implements INode {
            id: ID! @populatedBy(operations: [CREATE], callback: "nanoid")
            name: String!
            genre: [${genreType.name}!]! @relationship(type: "HAS_GENRE", direction: OUT)
        }

        type ${genreType.name} implements INode {
            id: ID! @populatedBy(operations: [CREATE], callback: "nanoid")
            value: String! @unique
        }
        `;

        const nanoid = () => {
            return `callback_value`;
        };

        await testHelper.initNeo4jGraphQL({ typeDefs, features: { populatedBy: { callbacks: { nanoid } } } });
    });

    afterAll(async () => {
        await testHelper.close();
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

        const result = await testHelper.executeGraphQL(query);

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

        const result = await testHelper.executeGraphQL(query);

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
