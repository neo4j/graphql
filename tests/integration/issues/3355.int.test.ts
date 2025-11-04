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

import { generate } from "randomstring";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3355", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeAll(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return info object when subscriptions enabled", async () => {
        const typeDefs = `
            type ${Movie} {
                id: ID!
                name: String
            }
        `;

        await testHelper.initNeo4jGraphQL({
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

        await testHelper.executeCypher(
            `
                CREATE (:${Movie} {id: $id, name: $initialName})
            `,
            {
                id,
                initialName,
            }
        );

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, name: updatedName },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult?.data?.[Movie.operations.update]).toEqual({ info: { nodesCreated: 0, nodesDeleted: 0 } });
    });
});
