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
import type { InterfaceEntityAdapter } from "./InterfaceEntityAdapter";

type RootTypeFieldNames = {
    create: string;
    read: string;
    update: string;
    delete: string;
    aggregate: string;
    subscribe: {
        created: string;
        updated: string;
        deleted: string;
        relationship_created: string;
        relationship_deleted: string;
    };
};

type FulltextTypeNames = {
    result: string;
    where: string;
    sort: string;
};

type AggregateTypeNames = {
    selection: string;
    input: string;
};

type MutationResponseTypeNames = {
    create: string;
    update: string;
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

export class InterfaceEntityOperations {
    private readonly InterfaceEntityAdapter: InterfaceEntityAdapter;
    private readonly pascalCasePlural: string;
    private readonly pascalCaseSingular: string;

    constructor(InterfaceEntityAdapter: InterfaceEntityAdapter) {
        this.InterfaceEntityAdapter = InterfaceEntityAdapter;
        this.pascalCasePlural = upperFirst(this.InterfaceEntityAdapter.plural);
        this.pascalCaseSingular = upperFirst(this.InterfaceEntityAdapter.singular);
    }

    public get whereInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}Where`;
    }

    public get implementationEnumTypename(): string {
        return `${this.InterfaceEntityAdapter.name}Implementation`;
    }

    public get whereOnImplementationsWhereInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ImplementationsWhere`;
    }

    public get uniqueWhereInputTypeName(): string {
        // ConnectOrCreateWhere.node
        return `${this.InterfaceEntityAdapter.name}UniqueWhere`;
    }

    public get connectOrCreateWhereInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ConnectOrCreateWhere`;
    }

    public get connectWhereInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ConnectWhere`;
    }

    public get createInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}CreateInput`;
    }

    public get updateInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}UpdateInput`;
    }

    public get whereOnImplementationsUpdateInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ImplementationsUpdateInput`;
    }

    public get deleteInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}DeleteInput`;
    }

    public get whereOnImplementationsDeleteInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ImplementationsDeleteInput`;
    }

    public get optionsInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}Options`;
    }

    public get fullTextInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}Fulltext`;
    }

    public get sortInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}Sort`;
    }

    public get relationInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}RelationInput`;
    }

    public get connectInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ConnectInput`;
    }

    public get connectOrCreateInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ConnectOrCreateInput`;
    }

    public get whereOnImplementationsConnectInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ImplementationsConnectInput`;
    }

    public get disconnectInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}DisconnectInput`;
    }

    public get whereOnImplementationsDisconnectInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ImplementationsDisconnectInput`;
    }

    public get onCreateInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}OnCreateInput`;
    }

    public get subscriptionWhereInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}SubscriptionWhere`;
    }

    public get subscriptionEventPayloadTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}EventPayload`;
    }

    public get implementationsSubscriptionWhereInputTypeName(): string {
        return `${this.InterfaceEntityAdapter.name}ImplementationsSubscriptionWhere`;
    }

    public getAggregationFieldTypename(): string {
        return this.aggregateTypeNames.selection;
    }

    public get rootTypeFieldNames(): RootTypeFieldNames {
        return {
            create: `create${this.pascalCasePlural}`,
            read: this.InterfaceEntityAdapter.plural,
            update: `update${this.pascalCasePlural}`,
            delete: `delete${this.pascalCasePlural}`,
            aggregate: `${this.InterfaceEntityAdapter.plural}Aggregate`,
            subscribe: {
                created: `${this.InterfaceEntityAdapter.singular}Created`,
                updated: `${this.InterfaceEntityAdapter.singular}Updated`,
                deleted: `${this.InterfaceEntityAdapter.singular}Deleted`,
                relationship_deleted: `${this.InterfaceEntityAdapter.singular}RelationshipDeleted`,
                relationship_created: `${this.InterfaceEntityAdapter.singular}RelationshipCreated`,
            },
        };
    }

    public get fulltextTypeNames(): FulltextTypeNames {
        return {
            result: `${this.pascalCaseSingular}FulltextResult`,
            where: `${this.pascalCaseSingular}FulltextWhere`,
            sort: `${this.pascalCaseSingular}FulltextSort`,
        };
    }

    public get aggregateTypeNames(): AggregateTypeNames {
        return {
            selection: `${this.InterfaceEntityAdapter.name}AggregateSelection`,
            input: `${this.InterfaceEntityAdapter.name}AggregateSelectionInput`,
        };
    }

    public get mutationResponseTypeNames(): MutationResponseTypeNames {
        return {
            create: `Create${this.pascalCasePlural}MutationResponse`,
            update: `Update${this.pascalCasePlural}MutationResponse`,
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
            create_relationship: `${this.InterfaceEntityAdapter.singular}`,
            delete_relationship: `${this.InterfaceEntityAdapter.singular}`,
        };
    }

    public get updateMutationArgumentNames(): UpdateMutationArgumentNames {
        return {
            connect: `${this.InterfaceEntityAdapter.name}ConnectInput`,
            disconnect: `${this.InterfaceEntityAdapter.name}DisconnectInput`,
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

    public get connectOrCreateWhereInputFieldNames() {
        return {
            node: `${this.uniqueWhereInputTypeName}!`,
        };
    }
}
