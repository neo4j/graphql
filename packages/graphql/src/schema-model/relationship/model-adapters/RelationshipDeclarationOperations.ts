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

import { isUnionEntity } from "../../../translate/queryAST/utils/is-union-entity";
import { upperFirst } from "../../../utils/upper-first";
import type { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipDeclarationAdapter } from "./RelationshipDeclarationAdapter";

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

export class RelationshipDeclarationOperations {
    private readonly relationshipDeclaration: RelationshipDeclarationAdapter;

    constructor(relationshipDeclaration: RelationshipDeclarationAdapter) {
        this.relationshipDeclaration = relationshipDeclaration;
    }

    public get prefixForTypename(): string {
        return this.relationshipDeclaration.firstDeclaredInTypeName || this.relationshipDeclaration.source.name;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}Connection`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public getAggregationFieldTypename(nestedField?: "node" | "edge"): string {
        const nestedFieldStr = upperFirst(nestedField || "");
        const aggregationStr = nestedField ? "Aggregate" : "Aggregation";
        return `${this.relationshipDeclaration.source.name}${this.relationshipDeclaration.target.name}${upperFirst(
            this.relationshipDeclaration.name
        )}${nestedFieldStr}${aggregationStr}Selection`;
    }

    public getTargetTypePrettyName(): string {
        if (this.relationshipDeclaration.isList) {
            return `[${this.relationshipDeclaration.target.name}!]${
                this.relationshipDeclaration.isNullable === false ? "!" : ""
            }`;
        }
        return `${this.relationshipDeclaration.target.name}${
            this.relationshipDeclaration.isNullable === false ? "!" : ""
        }`;
    }

    public get connectionSortInputTypename(): string {
        return `${this.connectionFieldTypename}Sort`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}Relationship`;
    }

    public get relationshipPropertiesFieldTypename(): string {
        return `${this.relationshipFieldTypename}Properties`;
    }

    public getFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }FieldInput`;
    }

    public getUpdateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }UpdateFieldInput`;
    }

    public getCreateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }CreateFieldInput`;
    }

    public getDeleteFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DeleteFieldInput`;
    }

    public getConnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }ConnectFieldInput`;
    }

    public getDisconnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DisconnectFieldInput`;
    }

    public getConnectOrCreateInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}ConnectOrCreateInput`;
    }

    public getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter?: ConcreteEntityAdapter): string {
        if (isUnionEntity(this.relationshipDeclaration.target)) {
            if (!concreteTargetEntityAdapter) {
                throw new Error("missing concreteTargetEntityAdapter");
            }
            return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
                concreteTargetEntityAdapter.name
            }ConnectOrCreateFieldInput`;
        }
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}ConnectOrCreateFieldInput`;
    }

    public getConnectOrCreateOnCreateFieldInputTypeName(concreteTargetEntityAdapter: ConcreteEntityAdapter): string {
        return `${this.getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter)}OnCreate`;
    }

    public get connectionFieldName(): string {
        return `${this.relationshipDeclaration.name}Connection`;
    }

    public getConnectionWhereTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }ConnectionWhere`;
    }

    public getUpdateConnectionInputTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }UpdateConnectionInput`;
    }

    public get aggregateInputTypeName(): string {
        return `${this.relationshipDeclaration.source.name}${upperFirst(
            this.relationshipDeclaration.name
        )}AggregateInput`;
    }

    public get aggregateTypeName(): string {
        return `${this.relationshipDeclaration.name}Aggregate`;
    }

    public getAggregationWhereInputTypeName(isA: "Node" | "Edge"): string {
        return `${this.relationshipDeclaration.source.name}${upperFirst(
            this.relationshipDeclaration.name
        )}${isA}AggregationWhereInput`;
    }

    // TODO: subscriptions?
    // public get subscriptionWhereInputTypeName(): string {
    //     return `${this.relationshipDeclaration.source.name}${upperFirst(
    //         this.relationshipDeclaration.name
    //     )}RelationshipSubscriptionWhere`;
    // }

    // public getToUnionSubscriptionWhereInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
    //     return `${this.relationshipDeclaration.source.name}${upperFirst(this.relationshipDeclaration.name)}${
    //         ifUnionRelationshipTargetEntity.name
    //     }SubscriptionWhere`;
    // }

    public get unionConnectInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}ConnectInput`;
    }

    public get unionDeleteInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}DeleteInput`;
    }

    public get unionDisconnectInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}DisconnectInput`;
    }

    public get unionCreateInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}CreateInput`;
    }

    public get unionCreateFieldInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}CreateFieldInput`;
    }

    public get unionUpdateInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}UpdateInput`;
    }

    public getToUnionUpdateInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.relationshipDeclaration.source.name}${upperFirst(this.relationshipDeclaration.name)}${
            ifUnionRelationshipTargetEntity.name
        }UpdateInput`;
    }

    // public get subscriptionConnectedRelationshipTypeName(): string {
    //     return `${this.relationshipDeclaration.source.name}${upperFirst(
    //         this.relationshipDeclaration.name
    //     )}ConnectedRelationship`;
    // }

    public get edgeCreateInputTypeName(): string {
        const isRequired = this.relationshipDeclaration.hasNonNullCreateInputFields;
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}EdgeCreateInput${isRequired ? `!` : ""}`;
    }

    public get createInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}EdgeCreateInput`;
    }

    public get edgeUpdateInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}EdgeUpdateInput`;
    }

    public get whereInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}EdgeWhere`;
    }

    public get sortInputTypeName(): string {
        return `${upperFirst(this.relationshipDeclaration.source.name)}${upperFirst(
            this.relationshipDeclaration.name
        )}EdgeSort`;
    }

    public getConnectOrCreateInputFields(target: ConcreteEntityAdapter) {
        // TODO: use this._target in the end; currently passed-in as argument because unions need this per refNode
        return {
            where: `${target.operations.connectOrCreateWhereInputTypeName}!`,
            onCreate: `${this.getConnectOrCreateOnCreateFieldInputTypeName(target)}!`,
        };
    }
}
