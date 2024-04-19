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

import { upperFirst } from "../../../utils/upper-first";
import type { ConcreteEntityAdapter } from "./ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "./InterfaceEntityAdapter";

export type RootTypeFieldNames = {
    create: string;
    connection: string;
    read: string;
    update: string;
    upsert: string;
    delete: string;
    aggregate: string;
};

type AggregateTypeNames = {
    selection: string;
    input: string;
};

type MutationResponseTypeNames = {
    create: string;
    update: string;
    upsert: string;
};

type SubscriptionEvents = {
    create: string;
    update: string;
    delete: string;
    create_relationship: string;
    delete_relationship: string;
};

export type UpdateMutationArgumentNames = {
    connect: string;
    disconnect: string;
    create: string;
    update: string;
    delete: string;
    connectOrCreate: string;
    where: string;
};

export type CreateMutationArgumentNames = {
    input: string;
};

export type UpsertMutationArgumentNames = {
    input: string;
};

/** ImplementingType refers to the common abstraction of an ObjectType (ConcreteEntity) and InterfaceType */
export class ImplementingEntityOperations<T extends InterfaceEntityAdapter | ConcreteEntityAdapter> {
    protected readonly pascalCasePlural: string;
    protected readonly pascalCaseSingular: string;
    protected readonly entityAdapter: T;

    constructor(entityAdapter: T) {
        this.entityAdapter = entityAdapter;
        this.pascalCasePlural = upperFirst(entityAdapter.plural);
        this.pascalCaseSingular = upperFirst(entityAdapter.singular);
    }

    public get whereInputTypeName(): string {
        return `${this.entityAdapter.name}Where`;
    }

    public get uniqueWhereInputTypeName(): string {
        return `${this.entityAdapter.name}UniqueWhere`;
    }

    public get connectOrCreateWhereInputTypeName(): string {
        return `${this.entityAdapter.name}ConnectOrCreateWhere`;
    }

    public get connectWhereInputTypeName(): string {
        return `${this.entityAdapter.name}ConnectWhere`;
    }

    public get createInputTypeName(): string {
        return `${this.entityAdapter.name}CreateInput`;
    }

    public get updateInputTypeName(): string {
        return `${this.entityAdapter.name}UpdateInput`;
    }

    public get upsertInputTypeName(): string {
        return `${this.entityAdapter.name}UpsertInput`;
    }

    public get deleteInputTypeName(): string {
        return `${this.entityAdapter.name}DeleteInput`;
    }

    public get optionsInputTypeName(): string {
        return `${this.entityAdapter.name}Options`;
    }

    public get sortInputTypeName(): string {
        return `${this.entityAdapter.name}Sort`;
    }

    public get relationInputTypeName(): string {
        return `${this.entityAdapter.name}RelationInput`;
    }

    public get connectInputTypeName(): string {
        return `${this.entityAdapter.name}ConnectInput`;
    }

    public get connectOrCreateInputTypeName(): string {
        return `${this.entityAdapter.name}ConnectOrCreateInput`;
    }

    public get disconnectInputTypeName(): string {
        return `${this.entityAdapter.name}DisconnectInput`;
    }

    public get onCreateInputTypeName(): string {
        return `${this.entityAdapter.name}OnCreateInput`;
    }

    public get onUpdateInputTypeName(): string {
        return `${this.entityAdapter.name}OnUpdateInput`;
    }

    public get subscriptionWhereInputTypeName(): string {
        return `${this.entityAdapter.name}SubscriptionWhere`;
    }

    public get subscriptionEventPayloadTypeName(): string {
        return `${this.entityAdapter.name}EventPayload`;
    }

    public get implementationsSubscriptionWhereInputTypeName(): string {
        return `${this.entityAdapter.name}ImplementationsSubscriptionWhere`;
    }

    public getAggregationFieldTypename(): string {
        return this.aggregateTypeNames.selection;
    }

    public get rootTypeFieldNames(): RootTypeFieldNames {
        return {
            connection: `${this.entityAdapter.plural}Connection`,
            create: `create${this.pascalCasePlural}`,
            read: this.entityAdapter.plural,
            update: `update${this.pascalCasePlural}`,
            delete: `delete${this.pascalCasePlural}`,
            aggregate: `${this.entityAdapter.plural}Aggregate`,
            upsert: `upsert${this.pascalCasePlural}`,
        };
    }

    public get aggregateTypeNames(): AggregateTypeNames {
        return {
            selection: `${this.entityAdapter.name}AggregateSelection`,
            input: `${this.entityAdapter.name}AggregateSelectionInput`,
        };
    }

    public get mutationResponseTypeNames(): MutationResponseTypeNames {
        return {
            create: `Create${this.pascalCasePlural}MutationResponse`,
            update: `Update${this.pascalCasePlural}MutationResponse`,
            upsert: `Upsert${this.pascalCasePlural}MutationResponse`,
        };
    }

    public get subscriptionEventTypeNames(): SubscriptionEvents {
        return {
            create: `${this.pascalCaseSingular}CreatedEvent`,
            update: `${this.pascalCaseSingular}UpdatedEvent`,
            delete: `${this.pascalCaseSingular}DeletedEvent`,
            create_relationship: `${this.pascalCaseSingular}RelationshipCreatedEvent`,
            delete_relationship: `${this.pascalCaseSingular}RelationshipDeletedEvent`,
        };
    }

    public get subscriptionEventPayloadFieldNames(): SubscriptionEvents {
        return {
            create: `created${this.pascalCaseSingular}`,
            update: `updated${this.pascalCaseSingular}`,
            delete: `deleted${this.pascalCaseSingular}`,
            create_relationship: `${this.entityAdapter.singular}`,
            delete_relationship: `${this.entityAdapter.singular}`,
        };
    }

    public get updateMutationArgumentNames(): UpdateMutationArgumentNames {
        return {
            connect: this.connectInputTypeName,
            disconnect: this.disconnectInputTypeName,
            create: this.relationInputTypeName,
            update: this.updateInputTypeName,
            delete: this.deleteInputTypeName,
            connectOrCreate: this.connectOrCreateInputTypeName,
            where: this.whereInputTypeName,
        };
    }

    public get createMutationArgumentNames(): CreateMutationArgumentNames {
        return {
            input: `[${this.createInputTypeName}!]!`,
        };
    }

    public get upsertMutationArgumentNames(): UpsertMutationArgumentNames {
        return {
            input: `[${this.upsertInputTypeName}!]!`,
        };
    }

    public get connectOrCreateWhereInputFieldNames() {
        return {
            node: `${this.uniqueWhereInputTypeName}!`,
        };
    }
}
