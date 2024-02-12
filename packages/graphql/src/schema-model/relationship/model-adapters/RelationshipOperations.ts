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

import { isInterfaceEntity } from "../../../translate/queryAST/utils/is-interface-entity";
import { isUnionEntity } from "../../../translate/queryAST/utils/is-union-entity";
import { upperFirst } from "../../../utils/upper-first";
import type { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "./RelationshipAdapter";

export class RelationshipOperations {
    private readonly relationship: RelationshipAdapter;

    constructor(relationship: RelationshipAdapter) {
        this.relationship = relationship;
    }

    public get prefixForTypename(): string {
        return this.relationship.firstDeclaredInTypeName || this.relationship.source.name;
    }

    public get fieldInputPrefixForTypename(): string {
        const isTargetInterface = isInterfaceEntity(this.relationship.target);
        if (isTargetInterface) {
            return this.relationship.source.name;
        }
        return this.prefixForTypename;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.relationship.name)}Connection`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public getAggregationFieldTypename(nestedField?: "node" | "edge"): string {
        const nestedFieldStr = upperFirst(nestedField || "");
        const aggregationStr = nestedField ? "Aggregate" : "Aggregation";
        return `${this.relationship.source.name}${this.relationship.target.name}${upperFirst(
            this.relationship.name
        )}${nestedFieldStr}${aggregationStr}Selection`;
    }

    public getTargetTypePrettyName(): string {
        if (this.relationship.isList) {
            return `[${this.relationship.target.name}!]${this.relationship.isNullable === false ? "!" : ""}`;
        }
        return `${this.relationship.target.name}${this.relationship.isNullable === false ? "!" : ""}`;
    }

    public get connectionSortInputTypename(): string {
        return `${this.connectionFieldTypename}Sort`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.relationship.name)}Relationship`;
    }

    public getFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }FieldInput`;
    }

    public getToUnionFieldInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity.name
        }FieldInput`;
    }

    public getUpdateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }UpdateFieldInput`;
    }

    public getCreateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }CreateFieldInput`;
    }

    public getDeleteFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DeleteFieldInput`;
    }

    public getConnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }ConnectFieldInput`;
    }

    public getDisconnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DisconnectFieldInput`;
    }

    public getConnectOrCreateInputTypeName(): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}ConnectOrCreateInput`;
    }

    public getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter?: ConcreteEntityAdapter): string {
        if (isUnionEntity(this.relationship.target)) {
            if (!concreteTargetEntityAdapter) {
                throw new Error("missing concreteTargetEntityAdapter");
            }
            return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
                concreteTargetEntityAdapter.name
            }ConnectOrCreateFieldInput`;
        }
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}ConnectOrCreateFieldInput`;
    }

    public getConnectOrCreateOnCreateFieldInputTypeName(concreteTargetEntityAdapter: ConcreteEntityAdapter): string {
        return `${this.getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter)}OnCreate`;
    }

    public get connectionFieldName(): string {
        return `${this.relationship.name}Connection`;
    }

    public getConnectionWhereTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }ConnectionWhere`;
    }

    public getUpdateConnectionInputTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }UpdateConnectionInput`;
    }

    public get aggregateInputTypeName(): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}AggregateInput`;
    }

    public get aggregateTypeName(): string {
        return `${this.relationship.name}Aggregate`;
    }

    public get nodeAggregationWhereInputTypeName(): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}NodeAggregationWhereInput`;
    }

    public get subscriptionWhereInputTypeName(): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}RelationshipSubscriptionWhere`;
    }

    public getToUnionSubscriptionWhereInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity.name
        }SubscriptionWhere`;
    }

    public get unionConnectInputTypeName(): string {
        return `${upperFirst(this.relationship.source.name)}${upperFirst(this.relationship.name)}ConnectInput`;
    }

    public get unionDeleteInputTypeName(): string {
        return `${upperFirst(this.relationship.source.name)}${upperFirst(this.relationship.name)}DeleteInput`;
    }

    public get unionDisconnectInputTypeName(): string {
        return `${upperFirst(this.relationship.source.name)}${upperFirst(this.relationship.name)}DisconnectInput`;
    }

    public get unionCreateInputTypeName(): string {
        return `${upperFirst(this.relationship.source.name)}${upperFirst(this.relationship.name)}CreateInput`;
    }

    public get unionCreateFieldInputTypeName(): string {
        return `${upperFirst(this.relationship.source.name)}${upperFirst(this.relationship.name)}CreateFieldInput`;
    }

    public get unionUpdateInputTypeName(): string {
        return `${upperFirst(this.relationship.source.name)}${upperFirst(this.relationship.name)}UpdateInput`;
    }

    public getToUnionUpdateInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity.name
        }UpdateInput`;
    }

    public get subscriptionConnectedRelationshipTypeName(): string {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}ConnectedRelationship`;
    }

    public get edgeCreateInputTypeName(): string {
        return `${this.relationship.propertiesTypeName}CreateInput${
            this.relationship.hasNonNullCreateInputFields ? `!` : ""
        }`;
    }
    public get createInputTypeName(): string {
        return `${this.relationship.propertiesTypeName}CreateInput`;
    }

    public get edgeUpdateInputTypeName(): string {
        return `${this.relationship.propertiesTypeName}UpdateInput`;
    }

    public get whereInputTypeName(): string {
        return `${this.relationship.propertiesTypeName}Where`;
    }
    public get edgeSubscriptionWhereInputTypeName(): string {
        return `${this.relationship.propertiesTypeName}SubscriptionWhere`;
    }
    public get sortInputTypeName(): string {
        return `${this.relationship.propertiesTypeName}Sort`;
    }

    public get edgeAggregationWhereInputTypeName(): string {
        return `${this.relationship.propertiesTypeName}AggregationWhereInput`;
    }

    public getConnectOrCreateInputFields(target: ConcreteEntityAdapter) {
        // TODO: use this._target in the end; currently passed-in as argument because unions need this per refNode
        return {
            where: `${target.operations.connectOrCreateWhereInputTypeName}!`,
            onCreate: `${this.getConnectOrCreateOnCreateFieldInputTypeName(target)}!`,
        };
    }
}
