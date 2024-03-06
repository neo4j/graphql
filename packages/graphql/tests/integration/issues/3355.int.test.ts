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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/3355", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Movie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return info object when subscriptions enabled", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type ${Movie} {
                id: ID!
                name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: new TestSubscriptionsEngine(),
            },
        });

        const id = generate({
            charset: "alphabetic",
        });

        const initialName = generate({
            charset: "alphabetic",
        });

        const updatedName = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $name: String) {
            ${Movie.operations.update}(where: { id: $id }, update: {name: $name}) {
                info {
                    nodesCreated
                    nodesDeleted
                }
            }
          }
        `;

        try {
            await session.run(
                `
                CREATE (:${Movie} {id: $id, name: $initialName})
            `,
                {
                    id,
                    initialName,
                }
            );

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id, name: updatedName },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.[Movie.operations.update]).toEqual({ info: { nodesCreated: 0, nodesDeleted: 0 } });
        } finally {
            await session.close();
        }
    });
});
