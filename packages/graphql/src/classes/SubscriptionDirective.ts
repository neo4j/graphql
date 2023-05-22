
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

import { SubscriptionOperations } from "../graphql/directives/subscription";

export class SubscriptionDirective {
    public create: boolean;
    public update: boolean;
    public delete: boolean;
    public createRelationship: boolean;
    public deleteRelationship: boolean;

    constructor(operations?: (SubscriptionOperations)[]) {
        const operationsSet = new Set(operations);
        this.create = operationsSet.has(SubscriptionOperations.CREATE);
        this.update = operationsSet.has(SubscriptionOperations.UPDATE);
        this.delete =  operationsSet.has(SubscriptionOperations.DELETE);
        this.createRelationship =  operationsSet.has(SubscriptionOperations.CREATE_RELATIONSHIP);
        this.deleteRelationship =  operationsSet.has(SubscriptionOperations.DELETE_RELATIONSHIP);
    }
}
