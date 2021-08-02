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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/375", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Should return newly created child", async () => {
        const session = driver.session();
        const typeDefs = gql`
            type Objective {
                id: ID! @id
                text: String!
                children: [Objective!]! @relationship(type: "HAS_CHILD", direction: OUT)
                parents: [Objective!]! @relationship(type: "HAS_CHILD", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const objectiveId = generate({
            charset: "alphabetic",
        });

        const objectiveText = generate({
            charset: "alphabetic",
        });

        const newObjectiveText = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation Mutation($updateObjectivesCreate: ObjectiveRelationInput, $updateObjectivesWhere: ObjectiveWhere) {
                updateObjectives(create: $updateObjectivesCreate, where: $updateObjectivesWhere) {
                    objectives {
                        id
                        text
                        children {
                            id
                            text
                        }
                    }
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:Objective { id: $objectiveId, text: $objectiveText })

                `,
                {
                    objectiveId,
                    objectiveText,
                }
            );

            const result = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
                variableValues: {
                    updateObjectivesWhere: {
                        id: objectiveId,
                    },
                    updateObjectivesCreate: {
                        children: [
                            {
                                node: {
                                    text: newObjectiveText,
                                },
                            },
                        ],
                    },
                },
            });
            expect(result.errors).toBeFalsy();
            expect(result?.data?.updateObjectives.objectives).toHaveLength(1);
            expect(result?.data?.updateObjectives.objectives[0].id).toEqual(objectiveId);
            expect(result?.data?.updateObjectives.objectives[0].text).toEqual(objectiveText);
            expect(result?.data?.updateObjectives.objectives[0].children).toHaveLength(1);
            expect(result?.data?.updateObjectives.objectives[0].children[0].text).toEqual(newObjectiveText);
        } finally {
            await session.close();
        }
    });
});
