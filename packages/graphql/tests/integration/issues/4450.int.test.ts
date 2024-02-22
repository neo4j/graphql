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
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4450", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neo4jGraphql: Neo4jGraphQL;

    const Actor = new UniqueType("Actor");
    const Scene = new UniqueType("Scene");
    const Location = new UniqueType("Location");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
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

        neo4jGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        const session = await neo4j.getSession();
        try {
            await session.run(
                `
                CREATE (:${Actor} {name: "actor-1"})-[:IN_SCENE {cut: true}]->(:${Scene} {number: 1})-[:AT_LOCATION]->(:${Location} {city: "test"})
                `,
                {}
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        try {
            await cleanNodes(driver, [Actor, Scene, Location]);
        } finally {
            await session.close();
        }
        await driver.close();
    });

    test("filtering through a connection to a many-to-1 relationship should work", async () => {
        const schema = await neo4jGraphql.getSchema();

        const query = /* GraphQL */ `
            query {
                ${Actor.plural}(where: { sceneConnection_SOME: { edge: { cut: true }, node: { location: { city: "test" } } } }) {
                    name
                }
            }
        `;

        const response = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });

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
