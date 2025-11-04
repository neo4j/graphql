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

describe("https://github.com/neo4j/graphql/issues/582", () => {
    const testHelper = new TestHelper();
    let type: UniqueType;
    let typeDefs: string;
    let query: string;

    beforeAll(async () => {
        type = testHelper.createUniqueType("Entity");

        typeDefs = `
            type ${type.name} {
                children: [${type.name}!]! @relationship(type: "EDGE", properties: "Edge", direction: OUT)
                parents: [${type.name}!]! @relationship(type: "EDGE", properties: "Edge", direction: IN)
                type: String!
            }

            type Edge @relationshipProperties {
                type: String!
            }
        `;

        query = `
            query ($where: ${type.name}Where) {
                ${type.plural}(where: $where) {
                    type
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${type.name} { type: "Cat" })-[:EDGE]->(:${type.name} { type: "Dog" })<-[:EDGE]-(:${type.name} { type: "Bird" })-[:EDGE]->(:${type.name} { type: "Fish" })
            `
        );
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should get all Cats where there exists at least one child Dog that has a Bird parent", async () => {
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                where: {
                    type: "Cat",
                    childrenConnection: {
                        node: {
                            type: "Dog",
                            parentsConnection: {
                                node: {
                                    type: "Bird",
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data?.[type.plural] as any[])[0]).toMatchObject({
            type: "Cat",
        });
    });

    test("should get all Cats where there exists at least one child Dog that has a Bird parent which has a Fish child", async () => {
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: {
                where: {
                    type: "Cat",
                    childrenConnection: {
                        node: {
                            type: "Dog",
                            parentsConnection: {
                                node: {
                                    type: "Bird",
                                    childrenConnection: {
                                        node: {
                                            type: "Fish",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult?.data?.[type.plural] as any[])[0]).toMatchObject({
            type: "Cat",
        });
    });
});
