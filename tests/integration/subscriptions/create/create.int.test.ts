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

import { gql } from "graphql-tag";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Subscriptions create", () => {
    const testHelper = new TestHelper();
    let plugin: TestSubscriptionsEngine;

    let typeActor: UniqueType;
    let typeMovie: UniqueType;

    beforeEach(async () => {
        typeActor = testHelper.createUniqueType("Actor");
        typeMovie = testHelper.createUniqueType("Movie");

        plugin = new TestSubscriptionsEngine();
        const typeDefs = gql`
            type ${typeActor.name} {
                name: String!
                movies: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${typeMovie.name} {
                id: ID!
                actors: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("creates complex create with subscriptions enabled", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.create}(
                input: [
                    {
                        id: "1"
                        actors: { create: { node: { name: "Andrés", movies: { create: { node: { id: 2 } } } } } }
                    }
                    {
                        id: "3"
                        actors: { create: { node: { name: "Darrell", movies: { create: { node: { id: 4 } } } } } }
                    }
                ]
            ) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[typeMovie.operations.create][typeMovie.plural]).toEqual([
            { id: "1" },
            { id: "3" },
        ]);

        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: { old: undefined, new: { id: "2" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: { old: undefined, new: { name: "Andrés" } },
                    typename: typeActor.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: { old: undefined, new: { id: "1" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: { old: undefined, new: { id: "4" } },
                    typename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: { old: undefined, new: { name: "Darrell" } },
                    typename: typeActor.name,
                },
                {
                    id: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create",
                    properties: { old: undefined, new: { id: "3" } },
                    typename: typeMovie.name,
                },
            ])
        );
    });
});
