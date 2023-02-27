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

import { gql } from "apollo-server";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import type { EventMeta } from "../../../src";
import { Neo4jGraphQL, Neo4jGraphQLSubscriptionsSingleInstancePlugin } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("Subscriptions Single Instance Plugin", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let plugin: Neo4jGraphQLSubscriptionsSingleInstancePlugin;

    const typeMovie = new UniqueType("Movie");

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        plugin = new Neo4jGraphQLSubscriptionsSingleInstancePlugin();
        const typeDefs = gql`
            type ${typeMovie.name} {
                id: ID!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                subscriptions: plugin,
            },
        });
    });

    afterAll(async () => {
        await driver.close();
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

        const gqlResult: any = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.operations.create][typeMovie.plural]).toEqual([{ id: "1" }]);
        const eventMeta = await onEventPromise;

        expect(eventMeta).toEqual({
            id: expect.any(Number),
            timestamp: expect.any(Number),
            event: "create",
            properties: { old: undefined, new: { id: "1" } },
            typename: typeMovie.name,
        });
    });
});
