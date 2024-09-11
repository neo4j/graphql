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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering", () => {
    let CustomType: UniqueType;

    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    beforeEach(() => {
        CustomType = testHelper.createUniqueType("CustomType");
    });

    test("DateTime cypher field", async () => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_time: DateTime
                    @cypher(
                        statement: """
                        RETURN datetime("2024-09-03T15:30:00Z") AS t
                        """
                        columnName: "t"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(
                    where: {
                        special_time_GT: "2024-09-02T00:00:00Z"
                    }
                ) {
                    special_time
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    special_time: "2024-09-03T15:30:00.000Z",
                    title: "test",
                },
            ],
        });
    });

    test("Duration cypher field", async () => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_duration: Duration
                    @cypher(
                        statement: """
                        RETURN duration('P14DT16H12M') AS d
                        """
                        columnName: "d"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(
                    where: {
                        special_duration: "P14DT16H12M"
                    }
                ) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    title: "test",
                },
            ],
        });
    });
});
