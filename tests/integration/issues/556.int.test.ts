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

describe("https://github.com/neo4j/graphql/issues/556 - Input Object type ArticleCreateInput must define one or more fields", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    let User: UniqueType;
    let Thing: UniqueType;

    beforeAll(() => {
        User = testHelper.createUniqueType("User");
        Thing = testHelper.createUniqueType("Thing");

        typeDefs = `
            type ${User} {
                name: String!
                things: [${Thing}!]! @relationship(type: "HAS_THINGS", direction: OUT)
            }

            type ${Thing} {
                id: ID! @id @unique
            }
        `;
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Can create empty nodes", async () => {
        const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            mutation {
                ${User.operations.create}(input: { name: "Darrell", things: { create: [{ node: {} }, { node: {} }] } }) {
                    ${User.plural} {
                        name
                        things {
                            id
                        }
                    }
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect((result.data as any)[User.operations.create][User.plural]).toHaveLength(1);
        expect((result.data as any)[User.operations.create][User.plural][0].name).toBe("Darrell");
        expect((result.data as any)[User.operations.create][User.plural][0].things).toHaveLength(2);
    });
});
