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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2871", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let FirstLevel: UniqueType;
    let SecondLevel: UniqueType;
    let ThirdLevel: UniqueType;

    const firstLevelInput1 = {
        id: "1",
        createdAt: new Date(10000000).toISOString(),
    };
    const firstLevelInput2 = {
        id: "2",
        createdAt: new Date(20000000).toISOString(),
    };
    const firstLevelInput3 = {
        id: "3",
        createdAt: new Date(30000000).toISOString(),
    };
    const secondLevelInput1 = {
        id: "4",
        createdAt: new Date(40000000).toISOString(),
    };
    const secondLevelInput2 = {
        id: "5",
        createdAt: new Date(50000000).toISOString(),
    };
    const secondLevelInput3 = {
        id: "6",
        createdAt: new Date(60000000).toISOString(),
    };
    const thirdLevelInput1 = {
        id: "7",
        createdAt: new Date(70000000).toISOString(),
    };
    const thirdLevelInput2 = {
        id: "8",
        createdAt: new Date(80000000).toISOString(),
    };
    const thirdLevelInput3 = {
        id: "9",
        createdAt: new Date(90000000).toISOString(),
    };

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        FirstLevel = new UniqueType("FirstLevel");
        SecondLevel = new UniqueType("SecondLevel");
        ThirdLevel = new UniqueType("ThirdLevel");

        await session.run(
            `
            CREATE (f1:${FirstLevel})-[:HAS_SECOND_LEVEL]->(s1:${SecondLevel})-[:HAS_THIRD_LEVEL]->(t1:${ThirdLevel})
            CREATE (f2:${FirstLevel})-[:HAS_SECOND_LEVEL]->(s2:${SecondLevel})-[:HAS_THIRD_LEVEL]->(t2:${ThirdLevel})
            CREATE (f3:${FirstLevel})
            CREATE (s3:${SecondLevel})
            CREATE (s2)-[:HAS_THIRD_LEVEL]->(t3:${ThirdLevel})
            SET f1 = $firstLevelInput1, f2 = $firstLevelInput2, f3 = $firstLevelInput3,
                s1 = $secondLevelInput1, s2 = $secondLevelInput2, s3 = $secondLevelInput3,
                t1 = $thirdLevelInput1, t2 = $thirdLevelInput2, t3 = $thirdLevelInput3
            
        `,
            {
                firstLevelInput1,
                firstLevelInput2,
                firstLevelInput3,
                secondLevelInput1,
                secondLevelInput2,
                secondLevelInput3,
                thirdLevelInput1,
                thirdLevelInput2,
                thirdLevelInput3,
            }
        );

        const typeDefs = `
            type ${FirstLevel} {
                id: ID! @id(unique: true)
                secondLevel: ${SecondLevel}! @relationship(type: "HAS_SECOND_LEVEL", direction: OUT)
                createdAt: DateTime! @timestamp(operations: [CREATE])
            }

            type ${SecondLevel} {
                id: ID! @id(unique: true)
                thirdLevel: [${ThirdLevel}!]! @relationship(type: "HAS_THIRD_LEVEL", direction: OUT)
                createdAt: DateTime! @timestamp(operations: [CREATE])
            }

            type ${ThirdLevel} {
                id: ID! @id(unique: true)
                createdAt: DateTime! @timestamp(operations: [CREATE])
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [FirstLevel, SecondLevel, ThirdLevel]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to filter by SOME nested within single relationship", async () => {
        const query = `
            query {
                ${FirstLevel.plural}(where: { secondLevel: { thirdLevel_SOME: { id: "${thirdLevelInput3.id}" } } }) {
                    id
                    createdAt
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [FirstLevel.plural]: expect.toIncludeSameMembers([firstLevelInput2]),
        });
    });

    test("should be able to filter by ALL nested within single relationship", async () => {
        const queryExpectingEmptyList = `
            query {
                ${FirstLevel.plural}(where: { secondLevel: { thirdLevel_ALL: { id: "${thirdLevelInput3.id}" } } }) {
                    id
                    createdAt
                }
            }
        `;

        const queryExpectingData = `
            query {
                ${FirstLevel.plural}(where: { secondLevel: { thirdLevel_ALL: { id: "${thirdLevelInput1.id}" } } }) {
                    id
                    createdAt
                }
            }
        `;

        const resultExpectingEmptyList = await graphql({
            schema: await neoSchema.getSchema(),
            source: queryExpectingEmptyList,
            contextValue: neo4j.getContextValues(),
        });
        const resultExpectingData = await graphql({
            schema: await neoSchema.getSchema(),
            source: queryExpectingData,
            contextValue: neo4j.getContextValues(),
        });

        expect(resultExpectingEmptyList.errors).toBeFalsy();
        expect(resultExpectingData.errors).toBeFalsy();
        expect(resultExpectingEmptyList.data).toEqual({
            [FirstLevel.plural]: [],
        });
        expect(resultExpectingData.data).toEqual({
            [FirstLevel.plural]: expect.toIncludeSameMembers([firstLevelInput1]),
        });
    });

    test("should not match if SOME second level relationships meet nested predicates", async () => {
        await session.run(`
            CREATE (f4:${FirstLevel})-[:HAS_SECOND_LEVEL]->(s4:${SecondLevel})
            CREATE (f4)-[:HAS_SECOND_LEVEL]->(s5:${SecondLevel})
        `);

        const query = `
            query {
                ${FirstLevel.plural}(where: { secondLevel: { thirdLevel_NONE: { id: "25" } } }) {
                    id
                    createdAt
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [FirstLevel.plural]: expect.toIncludeSameMembers([firstLevelInput1, firstLevelInput2]),
        });
    });
});
