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
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType } from "../../../utils/graphql-types";

describe("aggregations-top_level-basic", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should count nodes", async () => {
        const session = driver.session();

        const randomType = generateUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }
        `;

        const neo4jgraphql = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:${randomType.name} {id: randomUUID()})
                    CREATE (:${randomType.name} {id: randomUUID()})
                `
            );

            const query = `
                {
                    ${randomType.operations.aggregate} {
                        count
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neo4jgraphql.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[randomType.operations.aggregate]).toEqual({
                count: 2,
            });
        } finally {
            await session.close();
        }
    });
});
