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
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import type { EventMeta } from "../../../src/types";
import { TestHelper } from "../../utils/tests-helper";

describe("Subscriptions Single Instance Plugin", () => {
    const testHelper = new TestHelper();
    let plugin: Neo4jGraphQLSubscriptionsDefaultEngine;

    const typeMovie = testHelper.createUniqueType("Movie");

    beforeAll(async () => {
        plugin = new Neo4jGraphQLSubscriptionsDefaultEngine();
        const typeDefs = gql`
            type ${typeMovie.name} {
                id: ID!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("simple create with subscriptions enabled with single instance plugin", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.create}(
                input: [
                    {
                        id: "1"
                    }
                ]
            ) {
                ${typeMovie.plural} {
                    id
                }
            }
        }
        `;

        const onEventPromise = new Promise<EventMeta>((resolve) => {
            plugin.events.once("create", (ev: EventMeta) => {
                resolve(ev);
            });
        });

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.create][typeMovie.plural]).toEqual([{ id: "1" }]);
        const eventMeta = await onEventPromise;

        expect(eventMeta).toEqual({
            id: expect.any(String),
            timestamp: expect.any(Number),
            event: "create",
            properties: { old: undefined, new: { id: "1" } },
            typename: typeMovie.name,
        });
    });
});
