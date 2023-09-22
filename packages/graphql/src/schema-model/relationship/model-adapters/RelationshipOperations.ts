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
import type { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "./RelationshipAdapter";

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

export class RelationshipOperations {
    private readonly relationshipEntityAdapter: RelationshipAdapter;

    constructor(relationshipEntityAdapter: RelationshipAdapter) {
        this.relationshipEntityAdapter = relationshipEntityAdapter;
    }

    public get prefixForTypename(): string {
        // TODO: if relationship field is inherited  by source (part of a implemented Interface, not necessarily annotated as rel)
        // then return this.interface.name
        // TODO: how to get implemented interfaces here??
        // console.log(this.inheritedFrom, this.source.name, this.name);

        return this.relationshipEntityAdapter.inheritedFrom || this.relationshipEntityAdapter.source.name;
    }

    public get fieldInputPrefixForTypename(): string {
        const isTargetInterface = this.relationshipEntityAdapter.target instanceof InterfaceEntityAdapter;
        if (isTargetInterface) {
            return this.relationshipEntityAdapter.source.name;
        }
        return this.prefixForTypename;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}Connection`;
    }

    public getConnectionUnionWhereInputTypename(concreteEntityAdapter: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            concreteEntityAdapter.name
        }ConnectionWhere`;
    }

    public get connectionSortInputTypename(): string {
        return `${this.connectionFieldTypename}Sort`;
    }

    public get connectionWhereInputTypename(): string {
        return `${this.connectionFieldTypename}Where`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}Relationship`;
    }

    public getFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }FieldInput`;
    }

    public getToUnionFieldInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.relationshipEntityAdapter.source.name}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity.name
        }FieldInput`;
    }

    public getUpdateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }UpdateFieldInput`;
    }

    public getCreateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }CreateFieldInput`;
    }

    public getDeleteFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DeleteFieldInput`;
    }

    public getConnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }ConnectFieldInput`;
    }

    public getDisconnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DisconnectFieldInput`;
    }

    public getConnectOrCreateInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}ConnectOrCreateInput`;
    }

    public getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter?: ConcreteEntityAdapter): string {
        if (this.relationshipEntityAdapter.target instanceof UnionEntityAdapter) {
            if (!concreteTargetEntityAdapter) {
                throw new Error("missing concreteTargetEntityAdapter");
            }
            return `${this.prefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
                concreteTargetEntityAdapter.name
            }ConnectOrCreateFieldInput`;
        }
        return `${this.prefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}ConnectOrCreateFieldInput`;
    }

    public getConnectOrCreateOnCreateFieldInputTypeName(concreteTargetEntityAdapter: ConcreteEntityAdapter): string {
        return `${this.getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter)}OnCreate`;
    }

    public get connectionFieldName(): string {
        return `${this.relationshipEntityAdapter.name}Connection`;
    }

    public getConnectionWhereTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }ConnectionWhere`;
    }

    public getUpdateConnectionInputTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }UpdateConnectionInput`;
    }

    public get aggregateInputTypeName(): string {
        return `${this.relationshipEntityAdapter.source.name}${upperFirst(
            this.relationshipEntityAdapter.name
        )}AggregateInput`;
    }

    public get aggregateTypeName(): string {
        return `${this.relationshipEntityAdapter.name}Aggregate`;
    }

    public getAggregationWhereInputTypeName(isA: "Node" | "Edge"): string {
        return `${this.relationshipEntityAdapter.source.name}${upperFirst(
            this.relationshipEntityAdapter.name
        )}${isA}AggregationWhereInput`;
    }

    public get subscriptionWhereInputTypeName(): string {
        return `${this.relationshipEntityAdapter.source.name}${upperFirst(
            this.relationshipEntityAdapter.name
        )}RelationshipSubscriptionWhere`;
    }

    public getToUnionSubscriptionWhereInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.relationshipEntityAdapter.source.name}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity.name
        }SubscriptionWhere`;
    }

    public get unionConnectInputTypeName(): string {
        return `${upperFirst(this.relationshipEntityAdapter.source.name)}${upperFirst(
            this.relationshipEntityAdapter.name
        )}ConnectInput`;
    }

    public get unionDeleteInputTypeName(): string {
        return `${upperFirst(this.relationshipEntityAdapter.source.name)}${upperFirst(
            this.relationshipEntityAdapter.name
        )}DeleteInput`;
    }

    public get unionDisconnectInputTypeName(): string {
        return `${upperFirst(this.relationshipEntityAdapter.source.name)}${upperFirst(
            this.relationshipEntityAdapter.name
        )}DisconnectInput`;
    }

    public get unionCreateInputTypeName(): string {
        return `${upperFirst(this.relationshipEntityAdapter.source.name)}${upperFirst(
            this.relationshipEntityAdapter.name
        )}CreateInput`;
    }

    public get unionCreateFieldInputTypeName(): string {
        return `${upperFirst(this.relationshipEntityAdapter.source.name)}${upperFirst(
            this.relationshipEntityAdapter.name
        )}CreateFieldInput`;
    }

    public get unionUpdateInputTypeName(): string {
        return `${upperFirst(this.relationshipEntityAdapter.source.name)}${upperFirst(
            this.relationshipEntityAdapter.name
        )}UpdateInput`;
    }

    public getToUnionUpdateInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.relationshipEntityAdapter.source.name}${upperFirst(this.relationshipEntityAdapter.name)}${
            ifUnionRelationshipTargetEntity.name
        }UpdateInput`;
    }

    public get subscriptionConnectedRelationshipTypeName(): string {
        return `${this.relationshipEntityAdapter.source.name}${upperFirst(
            this.relationshipEntityAdapter.name
        )}ConnectedRelationship`;
    }

    public get edgeCreateInputTypeName(): string {
        return `${this.relationshipEntityAdapter.propertiesTypeName}CreateInput${
            this.relationshipEntityAdapter.hasNonNullNonGeneratedProperties ? `!` : ""
        }`;
    }
    public get createInputTypeName(): string {
        return `${this.relationshipEntityAdapter.propertiesTypeName}CreateInput`;
    }

    public get edgeUpdateInputTypeName(): string {
        return `${this.relationshipEntityAdapter.propertiesTypeName}UpdateInput`;
    }

    public get whereInputTypeName(): string {
        return `${this.relationshipEntityAdapter.propertiesTypeName}Where`;
    }
    public get edgeSubscriptionWhereInputTypeName(): string {
        return `${this.relationshipEntityAdapter.propertiesTypeName}SubscriptionWhere`;
    }
    public get sortInputTypeName(): string {
        return `${this.relationshipEntityAdapter.propertiesTypeName}Sort`;
    }

    public getConnectOrCreateInputFields(target: ConcreteEntityAdapter) {
        // TODO: use this._target in the end; currently passed-in as argument because unions need this per refNode
        return {
            where: `${target.operations.connectOrCreateWhereInputTypeName}!`,
            onCreate: `${this.getConnectOrCreateOnCreateFieldInputTypeName(target)}!`,
        };
    }
}
