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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4jHelper from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";

describe("Aggregate -> count", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should count nodes", async () => {
        const session = await neo4j.getSession();

        const randomType = new UniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:${randomType.name} {id: randomUUID()})
                    CREATE (:${randomType.name} {id: randomUUID()})
                `
            );

            const query = `
                {
                    ${randomType.operations.aggregate}{
                      count
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[randomType.operations.aggregate].count).toBe(2);
        } finally {
            await session.close();
        }
    });

    test("should count nodes with where and or predicate", async () => {
        const session = await neo4j.getSession();
        const randomType = new UniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(
                `
                CREATE (:${randomType.name} {id: $id1})
                CREATE (:${randomType.name} {id: $id2})
            `,
                { id1, id2 }
            );

            const query = `
                {
                  ${randomType.operations.aggregate}(where: { OR: [{id: "${id1}"}, {id: "${id2}"}] }){
                    count
                  }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[randomType.operations.aggregate].count).toBe(2);
        } finally {
            await session.close();
        }
    });
});
