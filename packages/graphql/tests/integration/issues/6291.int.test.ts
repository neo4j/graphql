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

describe("https://github.com/neo4j/graphql/issues/6291", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Pear: UniqueType;
    let Apple: UniqueType;
    let Banana: UniqueType;
    let Grape: UniqueType;
    let Carrot: UniqueType;
    let Potato: UniqueType;

    beforeAll(async () => {
        Pear = testHelper.createUniqueType("Pear");
        Apple = testHelper.createUniqueType("Apple");
        Banana = testHelper.createUniqueType("Banana");
        Grape = testHelper.createUniqueType("Grape");
        Carrot = testHelper.createUniqueType("Carrot");
        Potato = testHelper.createUniqueType("Potato");

        typeDefs = /* GraphQL */ `
            type ${Pear.name} {
                name: String!
                apples: [${Apple.name}!]! @relationship(type: "HAS_APPLE", direction: OUT)
            }

            type ${Apple.name} {
                # filter on apple.banana.price
                banana: ${Banana.name}! @relationship(type: "HAS_BANANA", direction: OUT)

                # filter on apple.grape.carrot.potato.number
                grape: ${Grape.name}! @relationship(type: "HAS_GRAPE", direction: OUT)
            }

            type ${Banana.name} {
                price: String!
            }

            type ${Grape.name} {
                carrot: ${Carrot.name} @relationship(type: "HAS_CARROT", direction: OUT)
            }

            type ${Carrot.name} {
                number: String!
                potato: ${Potato.name}! @relationship(type: "HAS_POTATO", direction: IN)
            }

            type ${Potato.name} {
                number: String!
            }
        `;

        await testHelper.executeCypher(`
            CREATE (pear1:${Pear.name} { name: "Beautiful Pear 1" })
            CREATE (pear2:${Pear.name} { name: "Beautiful Pear 2" })
            CREATE (pear3:${Pear.name} { name: "Beautiful Pear 3" })

            CREATE (apple1:${Apple.name})-[:HAS_BANANA]->(banana1:${Banana.name} { price: "awdawd" })
            CREATE (apple1)-[:HAS_GRAPE]->(grape1:${Grape.name})
            CREATE (grape1)-[:HAS_CARROT]->(carrot1:${Carrot.name})
            CREATE (carrot1)<-[:HAS_POTATO]-(potato1:${Potato.name} { number: "abc" })

            CREATE (pear1)-[:HAS_APPLE]->(apple1)
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

  
    test("should be able to filters pears by non nullable single relationships", async () => {
        const query = /* GraphQL */ `
            query Pears {
                ${Pear.plural} (
                    where: {
                        apples_SOME: { banana: { price: "awdawd" }, grape: { carrot: { potato: { number: "abc" } } } }
                    }
                ) 
                {
                    name
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Pear.plural]: expect.toIncludeSameMembers([
                {
                    name: "Beautiful Pear 1",
                },
            ]),
        });
    });
});
