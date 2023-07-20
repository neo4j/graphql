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
import type{ ConcreteEntityModel } from "./ConcreteEntityModel";
import type { AggregateTypeNames, FulltextTypeNames, MutationResponseTypeNames, RootTypeFieldNames, SubscriptionEvents } from "../../../classes/Node";

export class ConcreteEntityOperations {
    private readonly concreteEntityModel: ConcreteEntityModel;
    private readonly pascalCasePlural: string;
    private readonly pascalCaseSingular: string;

    constructor(concreteEntityModel: ConcreteEntityModel) {
        this.concreteEntityModel = concreteEntityModel;
        this.pascalCasePlural = upperFirst(this.concreteEntityModel.plural);
        this.pascalCaseSingular = upperFirst(this.concreteEntityModel.singular);
    }

    public get rootTypeFieldNames(): RootTypeFieldNames {
        return {
            create: `create${this.pascalCasePlural}`,
            read: this.concreteEntityModel.plural,
            update: `update${this.pascalCasePlural}`,
            delete: `delete${this.pascalCasePlural}`,
            aggregate: `${this.concreteEntityModel.plural}Aggregate`,
            subscribe: {
                created: `${this.concreteEntityModel.singular}Created`,
                updated: `${this.concreteEntityModel.singular}Updated`,
                deleted: `${this.concreteEntityModel.singular}Deleted`,
                relationship_deleted: `${this.concreteEntityModel.singular}RelationshipDeleted`,
                relationship_created: `${this.concreteEntityModel.singular}RelationshipCreated`,
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
            selection: `${this.concreteEntityModel.name}AggregateSelection`,
            input: `${this.concreteEntityModel.name}AggregateSelectionInput`,
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
            create_relationship: `${this.concreteEntityModel.singular}`,
            delete_relationship: `${this.concreteEntityModel.singular}`,
        };
    }
    
}