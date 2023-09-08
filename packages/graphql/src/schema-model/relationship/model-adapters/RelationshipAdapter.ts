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

import { upperFirst } from "graphql-compose";
import type { Annotations } from "../../annotation/Annotation";
import type { Attribute } from "../../attribute/Attribute";
import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import { ConcreteEntity } from "../../entity/ConcreteEntity";
import type { Entity } from "../../entity/Entity";
import { InterfaceEntity } from "../../entity/InterfaceEntity";
import { UnionEntity } from "../../entity/UnionEntity";
import { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../entity/model-adapters/UnionEntityAdapter";
import type { NestedOperation, QueryDirection, Relationship, RelationshipDirection } from "../Relationship";

export class RelationshipAdapter {
    public readonly name: string;
    public readonly type: string;
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly source: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter;
    private rawEntity: Entity;
    private _target: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter | undefined;
    public readonly direction: RelationshipDirection;
    public readonly queryDirection: QueryDirection;
    public readonly nestedOperations: NestedOperation[];
    public readonly aggregate: boolean;
    public readonly isNullable: boolean;
    public readonly description: string;
    public readonly propertiesTypeName: string | undefined;
    public readonly isList: boolean;
    public readonly annotations: Partial<Annotations>;

    public get prefixForTypename(): string {
        // TODO: if relationship field is inherited  by source (part of a implemented Interface, not necessarily annotated as rel)
        // then return this.interface.name
        // TODO: how to get implemented interfaces here??
        return this.source.name;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}Connection`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}Relationship`;
    }

    public get fieldInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}FieldInput`;
    }

    public get updateFieldInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}UpdateFieldInput`;
    }

    public get createFieldInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}CreateFieldInput`;
    }

    public get deleteFieldInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}DeleteFieldInput`;
    }

    public get connectFieldInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}ConnectFieldInput`;
    }
    public get disconnectFieldInputTypeName(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}DisconnectFieldInput`;
    }
    public get connectOrCreateFieldInputTypeName(): string {
        if (this.target instanceof UnionEntity) {
            return `${this.prefixForTypename}${upperFirst(this.name)}${this.target.name}ConnectOrCreateFieldInput`;
        }
        return `${this.prefixForTypename}${upperFirst(this.name)}ConnectOrCreateFieldInput`;
    }

    public get connectOrCreateOnCreateFieldInputTypeName(): string {
        return `${this.connectOrCreateFieldInputTypeName}OnCreate`;
    }

    public get connectionFieldName(): string {
        return `${this.name}Connection`;
    }

    public get connectionWhereTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}ConnectionWhere`;
    }
    public get updateConnectionInputTypename(): string {
        return `${this.prefixForTypename}${upperFirst(this.name)}UpdateConnectionInput`;
    }

    public get aggregateInputTypeName(): string {
        return `${this.source.name}${upperFirst(this.name)}AggregateInput`;
    }

    public getAggregationWhereInputTypeName(isA: "Node" | "Edge"): string {
        return `${this.source.name}${upperFirst(this.name)}${isA}AggregationWhereInput`;
    }

    public get edgeCreateInputTypeName(): string {
        return `${this.propertiesTypeName}CreateInput${this.hasNonNullNonGeneratedProperties ? `!` : ""}`;
    }

    public get edgeUpdateInputTypeName(): string {
        return `${this.propertiesTypeName}UpdateInput`;
    }

    public getConnectOrCreateInputFields(target: ConcreteEntityAdapter) {
        // TODO: use this._target in the end; currently passed-in as argument because unions need this per refNode
        // const target = this._target;
        // if (!(target instanceof ConcreteEntityAdapter)) {
        //     // something is wrong
        //     return;=
        // }
        return {
            where: `${target.operations.connectOrCreateWhereInputTypeName}!`,
            onCreate: `${this.connectOrCreateOnCreateFieldInputTypeName}!`,
        };
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public getAggregationFieldTypename(nestedField?: "node" | "edge"): string {
        const nestedFieldStr = upperFirst(nestedField || "");
        const aggregationStr = nestedField ? "Aggregate" : "Aggregation";
        return `${this.source.name}${upperFirst(this.target.name)}${upperFirst(
            this.name
        )}${nestedFieldStr}${aggregationStr}Selection`;
    }

    constructor(
        relationship: Relationship,
        sourceAdapter?: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter
    ) {
        const {
            name,
            type,
            attributes = new Map<string, Attribute>(),
            source,
            target,
            direction,
            isList,
            queryDirection,
            nestedOperations,
            aggregate,
            isNullable,
            description,
            annotations,
            propertiesTypeName,
        } = relationship;
        this.name = name;
        this.type = type;
        if (sourceAdapter) {
            this.source = sourceAdapter;
        } else {
            if (source instanceof ConcreteEntity) {
                this.source = new ConcreteEntityAdapter(source);
            } else if (source instanceof InterfaceEntity) {
                this.source = new InterfaceEntityAdapter(source);
            } else if (source instanceof UnionEntity) {
                this.source = new UnionEntityAdapter(source);
            } else {
                throw new Error("relationship source must be an Entity");
            }
        }
        this.direction = direction;
        this.isList = isList;
        this.queryDirection = queryDirection;
        this.nestedOperations = nestedOperations;
        this.aggregate = aggregate;
        this.isNullable = isNullable;
        this.rawEntity = target;
        this.initAttributes(attributes);
        this.description = description;
        this.annotations = annotations;
        this.propertiesTypeName = propertiesTypeName;
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
        }
    }

    public findAttribute(name: string): AttributeAdapter | undefined {
        return this.attributes.get(name);
    }
    /**
     * translation-only
     *
     * @param directed the direction asked during the query, for instance "friends(directed: true)"
     * @returns the direction to use in the CypherBuilder
     **/
    public getCypherDirection(directed?: boolean): "left" | "right" | "undirected" {
        switch (this.queryDirection) {
            case "DIRECTED_ONLY": {
                return this.cypherDirectionFromRelDirection();
            }
            case "UNDIRECTED_ONLY": {
                return "undirected";
            }
            case "DEFAULT_DIRECTED": {
                if (directed === false) {
                    return "undirected";
                }
                return this.cypherDirectionFromRelDirection();
            }
            case "DEFAULT_UNDIRECTED": {
                if (directed === true) {
                    return this.cypherDirectionFromRelDirection();
                }
                return "undirected";
            }
        }
    }

    private cypherDirectionFromRelDirection(): "left" | "right" {
        return this.direction === "IN" ? "left" : "right";
    }

    // construct the target entity only when requested
    get target(): ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter {
        if (!this._target) {
            if (this.rawEntity instanceof ConcreteEntity) {
                this._target = new ConcreteEntityAdapter(this.rawEntity);
            } else if (this.rawEntity instanceof InterfaceEntity) {
                this._target = new InterfaceEntityAdapter(this.rawEntity);
            } else if (this.rawEntity instanceof UnionEntity) {
                this._target = new UnionEntityAdapter(this.rawEntity);
            } else {
                throw new Error("invalid target entity type");
            }
        }
        return this._target;
    }

    getTargetTypePrettyName(): string {
        if (this.isList) {
            return `[${this.target.name}!]${this.isNullable === false ? "!" : ""}`;
        }
        return `${this.target.name}${this.isNullable === false ? "!" : ""}`;
    }

    isReadable(): boolean {
        return this.annotations.selectable?.onRead !== false;
    }

    isFilterableByValue(): boolean {
        return this.annotations.filterable?.byValue !== false;
    }

    isFilterableByAggregate(): boolean {
        return this.annotations.filterable?.byAggregate !== false;
    }

    isAggregable(): boolean {
        return this.annotations.selectable?.onAggregate !== false;
    }

    isCreatable(): boolean {
        return this.annotations.settable?.onCreate !== false;
    }

    isUpdatable(): boolean {
        return this.annotations.settable?.onUpdate !== false;
    }

    /*
        const nonGeneratedProperties = [
            ...objectFields.primitiveFields.filter((field) => !field.autogenerate),
            ...objectFields.scalarFields,
            ...objectFields.enumFields,
            ...objectFields.temporalFields.filter((field) => !field.timestamps),
            ...objectFields.pointFields,
        ];
        result.hasNonGeneratedProperties = nonGeneratedProperties.length > 0;
    */
    public get nonGeneratedProperties(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isNonGeneratedField());
    }

    public get hasNonNullNonGeneratedProperties(): boolean {
        return this.nonGeneratedProperties.some((property) => property.isRequired());
    }

    public get aggregableFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isAggregableField());
    }

    public get aggregationWhereFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isAggregationWhereField());
    }
}
