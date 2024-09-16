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

describe("https://github.com/neo4j/graphql/issues/4667", () => {
    const testHelper = new TestHelper();

    let MyThing: UniqueType;
    let MyStuff: UniqueType;

    beforeEach(async () => {
        MyThing = testHelper.createUniqueType("MyThing");
        MyStuff = testHelper.createUniqueType("MyStuff");

        await testHelper.executeCypher(`
            CREATE (:${MyThing} {id: "A"})-[:THE_STUFF]->(b1:${MyStuff} {id: "C"})
            CREATE (:${MyThing} {id: "B"})
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("when passed null as an argument of a relationship filter should check that a relationship does not exist", async () => {
        const typeDefs = /* GraphQL */ `
            type ${MyThing} {
                id: ID! @id
                stuff: ${MyStuff} @relationship(type: "THE_STUFF", direction: OUT)
            }

            type ${MyStuff} {
                id: ID! @id
                thing: ${MyThing} @relationship(type: "THE_STUFF", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query {
                ${MyThing.plural}(where: { stuff: null }) {
                    id
                    stuff {
                        id
                    }
                }

            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [MyThing.plural]: expect.toIncludeSameMembers([expect.objectContaining({ id: "B" })]),
        });
    });
});
