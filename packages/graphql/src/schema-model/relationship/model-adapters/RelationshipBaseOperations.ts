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

    protected abstract get prefixForTypename(): string;
    protected abstract get fieldInputPrefixForTypename(): string;
    protected abstract get edgePrefix(): string;

    protected get name() {
        return this.relationship.name;
    }

    protected get sourceName() {
        return this.relationship.source.name;
    }

    protected get target() {
        return this.relationship.target;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public getAggregationFieldTypename(nestedField?: "node" | "edge"): string {
        const nestedFieldStr = upperFirst(nestedField || "");
        const aggregationStr = nestedField ? "Aggregate" : "Aggregation";
        return `${this.sourceName}${this.target.name}${upperFirst(
            this.name
        )}${nestedFieldStr}${aggregationStr}Selection`;
    }

    public getTargetTypePrettyName(): string {
        if (this.relationship.isList) {
            return `[${this.target.name}!]${this.relationship.isNullable === false ? "!" : ""}`;
        }
        return `${this.target.name}${this.relationship.isNullable === false ? "!" : ""}`;
    }

    public getFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.sourceName}${upperFirst(this.name)}${ifUnionRelationshipTargetEntity?.name || ""}FieldInput`;
    }

    public getConnectionUnionWhereInputTypename(concreteEntityAdapter: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}${concreteEntityAdapter.name}ConnectionWhere`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}Connection`;
    }

    public get connectionSortInputTypename(): string {
        return `${this.connectionFieldTypename}Sort`;
    }

    public get connectionWhereInputTypename(): string {
        return `${this.connectionFieldTypename}Where`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}Relationship`;
    }

    public getUpdateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.sourceName}${upperFirst(this.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }UpdateFieldInput`;
    }

    public getCreateFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.sourceName}${upperFirst(this.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }CreateFieldInput`;
    }

    public getDeleteFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DeleteFieldInput`;
    }

    public getConnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.sourceName}${upperFirst(this.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }ConnectFieldInput`;
    }

    public getDisconnectFieldInputTypeName(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.fieldInputPrefixForTypename}${upperFirst(this.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }DisconnectFieldInput`;
    }

    public getConnectOrCreateInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}ConnectOrCreateInput`;
    }

    public getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter?: ConcreteEntityAdapter): string {
        if (isUnionEntity(this.target)) {
            if (!concreteTargetEntityAdapter) {
                throw new Error("missing concreteTargetEntityAdapter");
            }
            return `${this.prefixForTypename}${upperFirst(this.name)}${
                concreteTargetEntityAdapter.name
            }ConnectOrCreateFieldInput`;
        }
        return `${this.prefixForTypename}${upperFirst(this.name)}ConnectOrCreateFieldInput`;
    }

    public getConnectOrCreateOnCreateFieldInputTypeName(concreteTargetEntityAdapter: ConcreteEntityAdapter): string {
        return `${this.getConnectOrCreateFieldInputTypeName(concreteTargetEntityAdapter)}OnCreate`;
    }

    public get connectionFieldName(): string {
        return `${this.name}Connection`;
    }

    public getConnectionWhereTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }ConnectionWhere`;
    }

    public getUpdateConnectionInputTypename(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): string {
        return `${this.sourceName}${upperFirst(this.name)}${
            ifUnionRelationshipTargetEntity?.name || ""
        }UpdateConnectionInput`;
    }

    public get aggregateInputTypeName(): string {
        return `${this.sourceName}${upperFirst(this.name)}AggregateInput`;
    }

    public get aggregateTypeName(): string {
        return `${this.name}Aggregate`;
    }

    public getAggregationWhereInputTypeName(isA: "Node" | "Edge"): string {
        return `${this.sourceName}${upperFirst(this.name)}${isA}AggregationWhereInput`;
    }

    public get unionConnectInputTypeName(): string {
        return `${upperFirst(this.sourceName)}${upperFirst(this.name)}ConnectInput`;
    }

    public get unionDeleteInputTypeName(): string {
        return `${upperFirst(this.sourceName)}${upperFirst(this.name)}DeleteInput`;
    }

    public get unionDisconnectInputTypeName(): string {
        return `${upperFirst(this.sourceName)}${upperFirst(this.name)}DisconnectInput`;
    }

    public get unionCreateInputTypeName(): string {
        return `${upperFirst(this.sourceName)}${upperFirst(this.name)}CreateInput`;
    }

    public get unionCreateFieldInputTypeName(): string {
        return `${upperFirst(this.sourceName)}${upperFirst(this.name)}CreateFieldInput`;
    }

    public get unionUpdateInputTypeName(): string {
        return `${upperFirst(this.sourceName)}${upperFirst(this.name)}UpdateInput`;
    }

    public getToUnionUpdateInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.sourceName}${upperFirst(this.name)}${ifUnionRelationshipTargetEntity.name}UpdateInput`;
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

    public getConnectOrCreateInputFields(target: ConcreteEntityAdapter) {
        // TODO: use this._target in the end; currently passed-in as argument because unions need this per refNode
        return {
            where: `${target.operations.connectOrCreateWhereInputTypeName}!`,
            onCreate: `${this.getConnectOrCreateOnCreateFieldInputTypeName(target)}!`,
        };
    }
}
