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

describe("https://github.com/neo4j/graphql/issues/2847", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;
    let Product: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        Product = testHelper.createUniqueType("Product");

        const typeDefs = `
          interface ${Product} {
            name: String!
          }
          
          type ${Movie} implements ${Product} {
            name: String!
          }
        
          type ${Actor} {
            name: String!
            product: ${Product} @relationship(type: "HAS_PRODUCT", direction: OUT)
          }
        `;

        await testHelper.executeCypher(
            `
            CREATE (c:${Actor})
            SET c.name = $name
        `,
            { name: "Keanu" }
        );

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should returns actors even without any related product", async () => {
        const query = `
            query {
                ${Actor.plural} {
                  name
                  product {
                    name
                  } 
                }
              }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                    product: null,
                },
            ]),
        });
    });
});
