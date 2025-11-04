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

describe("https://github.com/neo4j/graphql/issues/4450", () => {
    const testHelper = new TestHelper();

    let Actor: UniqueType;
    let Scene: UniqueType;
    let Location: UniqueType;

    beforeAll(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Scene = testHelper.createUniqueType("Scene");
        Location = testHelper.createUniqueType("Location");

        const typeDefs = /* GraphQL */ `
            type ${Actor} {
                name: String
                scene: [${Scene}!]! @relationship(type: "IN_SCENE", properties: "ActorScene", direction: OUT)
            }

            type ${Scene} {
                number: Int
                actors: [${Actor}!]! @relationship(type: "IN_SCENE", properties: "ActorScene", direction: IN)
                location: ${Location}! @relationship(type: "AT_LOCATION", direction: OUT)
            }

            type ${Location} {
                city: String
                scenes: [${Scene}!]! @relationship(type: "AT_LOCATION", direction: IN)
            }

            type ActorScene @relationshipProperties {
                cut: Boolean
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
                CREATE (:${Actor} {name: "actor-1"})-[:IN_SCENE {cut: true}]->(:${Scene} {number: 1})-[:AT_LOCATION]->(:${Location} {city: "test"})
                `
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("filtering through a connection to a many-to-1 relationship should work", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural}(where: { sceneConnection_SOME: { edge: { cut: true }, node: { location: { city: "test" } } } }) {
                    name
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            [Actor.plural]: [
                {
                    name: "actor-1",
                },
            ],
        });
    });
});
