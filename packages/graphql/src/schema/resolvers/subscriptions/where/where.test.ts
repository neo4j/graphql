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

import { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { SubscriptionsEvent } from "../../../../types";
import { subscriptionWhere } from "./where";

describe("subscriptionWhere", () => {
    test("filters expected", () => {
        const args: Record<string, any> = {
            title: "movie1",
        };

        const event: SubscriptionsEvent = {
            event: "create",
            properties: {
                old: undefined,
                new: {
                    title: "movie1",
                },
            },
            id: "1",
            timestamp: 1,
            typename: "Movie",
        };

        const concreteEntity = new ConcreteEntity({
            name: "Movie",
            labels: ["Movie"],
            annotations: {},
            attributes: [],
            compositeEntities: [],
            description: undefined,
            relationships: [],
        });
        const concreteEntityAdapter = new ConcreteEntityAdapter(concreteEntity);

        expect(subscriptionWhere({ where: args, event, entityAdapter: concreteEntityAdapter })).toBe(true);
    });

    test("filters expected not", () => {
        const args: Record<string, any> = {
            title: "movie2",
        };

        const event: SubscriptionsEvent = {
            event: "create",
            properties: {
                old: undefined,
                new: {
                    title: "movie1",
                },
            },
            id: "1",
            timestamp: 1,
            typename: "Movie",
        };

        const concreteEntity = new ConcreteEntity({
            name: "Movie",
            labels: ["Movie"],
            annotations: {},
            attributes: [],
            compositeEntities: [],
            description: undefined,
            relationships: [],
        });
        const concreteEntityAdapter = new ConcreteEntityAdapter(concreteEntity);

        expect(subscriptionWhere({ where: args, event, entityAdapter: concreteEntityAdapter })).toBe(false);
    });
});
