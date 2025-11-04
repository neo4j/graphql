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

import type { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import { upperFirst } from "../../../utils/upper-first";
import { isUnionEntity } from "../../../translate/queryAST/utils/is-union-entity";
import type { RelationshipDeclarationAdapter } from "./RelationshipDeclarationAdapter";
import type { RelationshipAdapter } from "./RelationshipAdapter";

export abstract class RelationshipBaseOperations<T extends RelationshipAdapter | RelationshipDeclarationAdapter> {
    protected constructor(protected readonly relationship: T) {}

    protected get prefixForTypename() {
        return `${this.relationship.source.name}${upperFirst(this.relationship.name)}`;
    }

    protected get prefixForTypenameWithInheritance(): string {
        const prefix = this.relationship.firstDeclaredInTypeName || this.relationship.source.name;
        return `${prefix}${upperFirst(this.relationship.name)}`;
    }

    protected abstract get fieldInputPrefixForTypename(): string;

    protected abstract get edgePrefix(): string;

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
            return `[${this.relationship.target.name}!]${!this.relationship.isNullable ? "!" : ""}`;
        }
        return `${this.relationship.target.name}${!this.relationship.isNullable ? "!" : ""}`;
    }

    public getFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${ifUnionRelationshipTargetEntity?.name || ""}FieldInput`;
    }

    public getConnectionUnionWhereInputTypename(concreteEntityAdapter: ConcreteEntityAdapter): string {
        return `${this.prefixForTypenameWithInheritance}${concreteEntityAdapter.name}ConnectionWhere`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.prefixForTypenameWithInheritance}Connection`;
    }

    public get connectionSortInputTypename(): string {
        return `${this.connectionFieldTypename}Sort`;
    }

    public get connectionWhereInputTypename(): string {
        return `${this.connectionFieldTypename}Where`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.prefixForTypenameWithInheritance}Relationship`;
    }

    public getUpdateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${ifUnionRelationshipTargetEntity?.name || ""}UpdateFieldInput`;
    }

    public getCreateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${ifUnionRelationshipTargetEntity?.name || ""}CreateFieldInput`;
    }

    public getDeleteFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DeleteFieldInput`;
    }

    public getConnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${ifUnionRelationshipTargetEntity?.name || ""}ConnectFieldInput`;
    }

    public getDisconnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.relationship.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DisconnectFieldInput`;
    }

    public getConnectOrCreateInputTypeName(): string {
        return `${this.prefixForTypename}ConnectOrCreateInput`;
    }

    public getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter?: ConcreteEntityAdapter): string {
        if (isUnionEntity(this.relationship.target)) {
            if (!concreteTargetEntityAdapter) {
                throw new Error("missing concreteTargetEntityAdapter");
            }
            return `${this.prefixForTypename}${concreteTargetEntityAdapter.name}ConnectOrCreateFieldInput`;
        }
        return `${this.prefixForTypename}ConnectOrCreateFieldInput`;
    }

    public getConnectOrCreateOnCreateFieldInputTypeName(concreteTargetEntityAdapter: ConcreteEntityAdapter): string {
        return `${this.getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter)}OnCreate`;
    }

    public get connectionFieldName(): string {
        return `${this.relationship.name}Connection`;
    }

    public getConnectionWhereTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypenameWithInheritance}${ifUnionRelationshipTargetEntity?.name || ""}ConnectionWhere`;
    }

    public getUpdateConnectionInputTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${ifUnionRelationshipTargetEntity?.name || ""}UpdateConnectionInput`;
    }

    public get aggregateInputTypeName(): string {
        return `${this.prefixForTypename}AggregateInput`;
    }

    public get aggregateTypeName(): string {
        return `${this.relationship.name}Aggregate`;
    }

    public get nodeAggregationWhereInputTypeName(): string {
        return `${this.prefixForTypename}NodeAggregationWhereInput`;
    }

    public get unionConnectInputTypeName(): string {
        return `${upperFirst(this.prefixForTypename)}ConnectInput`;
    }

    public get unionDeleteInputTypeName(): string {
        return `${upperFirst(this.prefixForTypename)}DeleteInput`;
    }

    public get unionDisconnectInputTypeName(): string {
        return `${upperFirst(this.prefixForTypename)}DisconnectInput`;
    }

    public get unionCreateInputTypeName(): string {
        return `${upperFirst(this.prefixForTypename)}CreateInput`;
    }

    public get unionCreateFieldInputTypeName(): string {
        return `${upperFirst(this.prefixForTypename)}CreateFieldInput`;
    }

    public get unionUpdateInputTypeName(): string {
        return `${upperFirst(this.prefixForTypename)}UpdateInput`;
    }

    public getToUnionUpdateInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${ifUnionRelationshipTargetEntity.name}UpdateInput`;
    }

    public get edgeCreateInputTypeName(): string {
        const isRequired = this.relationship.hasNonNullCreateInputFields;
        return `${this.edgePrefix}CreateInput${isRequired ? `!` : ""}`;
    }

    public get createInputTypeName(): string {
        return `${this.edgePrefix}CreateInput`;
    }

    public get edgeUpdateInputTypeName(): string {
        return `${this.edgePrefix}UpdateInput`;
    }

    public get whereInputTypeName(): string {
        return `${this.edgePrefix}Where`;
    }

    public get sortInputTypeName(): string {
        return `${this.edgePrefix}Sort`;
    }

    public get edgeAggregationWhereInputTypeName(): string {
        return `${this.edgePrefix}AggregationWhereInput`;
    }

    public getConnectOrCreateInputFields(target: ConcreteEntityAdapter) {
        // TODO: use this._target in the end; currently passed-in as argument because unions need this per refNode
        return {
            where: `${target.operations.connectOrCreateWhereInputTypeName}!`,
            onCreate: `${this.getConnectOrCreateOnCreateFieldInputTypeName(target)}!`,
        };
    }
}
