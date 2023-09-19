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

export class ConcreteEntityOperations {
    private readonly concreteEntityAdapter: ConcreteEntityAdapter;
    private readonly pascalCasePlural: string;
    private readonly pascalCaseSingular: string;

    constructor(concreteEntityAdapter: ConcreteEntityAdapter) {
        this.concreteEntityAdapter = concreteEntityAdapter;
        this.pascalCasePlural = upperFirst(this.concreteEntityAdapter.plural);
        this.pascalCaseSingular = upperFirst(this.concreteEntityAdapter.singular);
    }

    public get whereInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}Where`;
    }

    public get uniqueWhereInputTypeName(): string {
        // ConnectOrCreateWhere.node
        return `${this.concreteEntityAdapter.name}UniqueWhere`;
    }

    public get connectOrCreateWhereInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}ConnectOrCreateWhere`;
    }

    public get createInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}CreateInput`;
    }

    public get updateInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}UpdateInput`;
    }

    public get deleteInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}DeleteInput`;
    }

    public get optionsInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}Options`;
    }

    public get fullTextInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}Fulltext`;
    }

    public get sortInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}Sort`;
    }

    public get relationInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}RelationInput`;
    }

    public get connectInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}ConnectInput`;
    }

    public get disconnectInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}DisconnectInput`;
    }

    public get onCreateInputTypeName(): string {
        return `${this.concreteEntityAdapter.name}OnCreateInput`;
    }

    public get rootTypeFieldNames(): RootTypeFieldNames {
        return {
            create: `create${this.pascalCasePlural}`,
            read: this.concreteEntityAdapter.plural,
            update: `update${this.pascalCasePlural}`,
            delete: `delete${this.pascalCasePlural}`,
            aggregate: `${this.concreteEntityAdapter.plural}Aggregate`,
            subscribe: {
                created: `${this.concreteEntityAdapter.singular}Created`,
                updated: `${this.concreteEntityAdapter.singular}Updated`,
                deleted: `${this.concreteEntityAdapter.singular}Deleted`,
                relationship_deleted: `${this.concreteEntityAdapter.singular}RelationshipDeleted`,
                relationship_created: `${this.concreteEntityAdapter.singular}RelationshipCreated`,
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
            selection: `${this.concreteEntityAdapter.name}AggregateSelection`,
            input: `${this.concreteEntityAdapter.name}AggregateSelectionInput`,
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
            create_relationship: `${this.concreteEntityAdapter.singular}`,
            delete_relationship: `${this.concreteEntityAdapter.singular}`,
        };
    }

    public get updateMutationArgumentNames(): UpdateMutationArgumentNames {
        return {
            connect: `${this.concreteEntityAdapter.name}ConnectInput`,
            disconnect: `${this.concreteEntityAdapter.name}DisconnectInput`,
            create: this.relationInputTypeName,
            update: this.updateInputTypeName,
            delete: this.deleteInputTypeName,
            connectOrCreate: `${this.concreteEntityAdapter.name}ConnectOrCreateInput`,
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
