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

import { SubscriptionEvent } from "../graphql/directives/subscription";

export class SubscriptionDirective {
    public created: boolean;
    public updated: boolean;
    public deleted: boolean;
    public relationshipCreated: boolean;
    public relationshipDeleted: boolean;

    constructor(operations?: SubscriptionEvent[]) {
        const operationsSet = new Set(operations);
        this.created = operationsSet.has(SubscriptionEvent.CREATED);
        this.updated = operationsSet.has(SubscriptionEvent.UPDATED);
        this.deleted = operationsSet.has(SubscriptionEvent.DELETED);
        this.relationshipCreated = operationsSet.has(SubscriptionEvent.RELATIONSHIP_CREATED);
        this.relationshipDeleted = operationsSet.has(SubscriptionEvent.RELATIONSHIP_DELETED);
    }
}
