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

describe("https://github.com/neo4j/graphql/issues/5635", () => {
    let Owner: UniqueType;
    let MyNode: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Owner = testHelper.createUniqueType("Owner");
        MyNode = testHelper.createUniqueType("MyNode");

        const typeDefs = /* GraphQL */ `
            type ${Owner} {
                id: ID! @unique @id
                owns: [${MyNode}!]! @relationship(type: "OWNS", direction: OUT)
            }

            type ${MyNode}
                @authorization(
                    validate: [
                        {
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            where: { node: { owner: { id: "$jwt.sub" } } }
                            when: [AFTER]
                        }
                    ]
                ) {
                id: ID! @unique @id
                name: String!
                owner: ${Owner}! @relationship(type: "OWNS", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("validation should applied correctly without causing cypher errors", async () => {
        await testHelper.executeCypher(`
          CREATE (c:${MyNode.name} {id: 'abc'})<-[:OWNS]-(o:${Owner.name} {id: 'abc'})
        `);

        const mutation = /* GraphQL */ `
            mutation {
                ${MyNode.operations.create}(input: [{ 
                        name: "Test",
                        owner: { 
                            connectOrCreate: {
                                onCreate: { 
                                    node: {  } 
                                }, 
                                where: { node: { id: "abc" } } 
                            } 
                        } 
                    }]) {
                    ${MyNode.plural} {
                        id
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(mutation, {
            contextValue: {
                token: testHelper.createBearerToken("secret", { sub: "abc" }),
            },
        });
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [MyNode.operations.create]: {
                [MyNode.plural]: [
                    {
                        id: expect.any(String),
                        name: "Test",
                    },
                ],
            },
        });
    });
});
