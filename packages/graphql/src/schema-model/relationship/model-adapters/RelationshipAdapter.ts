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
import type { Argument } from "../../argument/Argument";
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
import { RelationshipOperations } from "./RelationshipOperations";
import { plural, singular } from "../../utils/string-manipulation";
import { RelationshipNestedOperationsOption } from "../../../constants";

export class RelationshipAdapter {
    public readonly name: string;
    public readonly type: string;
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly source: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter;
    private rawEntity: Entity;
    private _target: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter | undefined;
    public readonly direction: RelationshipDirection;
    public readonly queryDirection: QueryDirection;
    public readonly nestedOperations: Set<NestedOperation>;
    public readonly aggregate: boolean;
    public readonly isNullable: boolean;
    public readonly description?: string;
    public readonly propertiesTypeName: string | undefined;
    public readonly inheritedFrom: string | undefined;
    public readonly isList: boolean;
    public readonly annotations: Partial<Annotations>;
    public readonly args: Argument[];

    private _singular: string | undefined;
    private _plural: string | undefined;

    // specialize models
    private _operations: RelationshipOperations | undefined;

    constructor(
        relationship: Relationship,
        sourceAdapter?: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter
    ) {
        const {
            name,
            type,
            args,
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
            inheritedFrom,
        } = relationship;
        this.name = name;
        this.type = type;
        this.args = args;
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
        this.nestedOperations = new Set(nestedOperations);
        this.aggregate = aggregate;
        this.isNullable = isNullable;
        this.rawEntity = target;
        this.initAttributes(attributes);
        this.description = description;
        this.annotations = annotations;
        this.propertiesTypeName = propertiesTypeName;
        this.inheritedFrom = inheritedFrom;
    }

    get operations(): RelationshipOperations {
        if (!this._operations) {
            return new RelationshipOperations(this);
        }
        return this._operations;
    }
    public get singular(): string {
        if (!this._singular) {
            this._singular = singular(this.name);
        }
        return this._singular;
    }

    public get plural(): string {
        if (!this._plural) {
            this._plural = plural(this.name);
        }
        return this._plural;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public getAggregationFieldTypename(nestedField?: "node" | "edge"): string {
        const nestedFieldStr = upperFirst(nestedField || "");
        const aggregationStr = nestedField ? "Aggregate" : "Aggregation";
        return `${this.source.name}${this.target.name}${upperFirst(
            this.name
        )}${nestedFieldStr}${aggregationStr}Selection`;
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

    shouldGenerateFieldInputType(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): boolean {
        let relationshipTarget = this.target;
        if (ifUnionRelationshipTargetEntity) {
            relationshipTarget = ifUnionRelationshipTargetEntity;
        }
        return (
            this.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT) ||
            this.nestedOperations.has(RelationshipNestedOperationsOption.CREATE) ||
            // The connectOrCreate field is not generated if the related type does not have a unique field
            (this.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
                relationshipTarget instanceof ConcreteEntityAdapter &&
                relationshipTarget.uniqueFields.length > 0)
        );
    }

    shouldGenerateUpdateFieldInputType(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): boolean {
        let relationshipTarget = this.target;
        if (ifUnionRelationshipTargetEntity) {
            relationshipTarget = ifUnionRelationshipTargetEntity;
        }
        if (!(relationshipTarget instanceof ConcreteEntityAdapter)) {
            throw new Error("Expected target to be concrete.");
        }
        // If the only nestedOperation is connectOrCreate, it won't be generated if there are no unique fields on the related type
        const onlyConnectOrCreateAndNoUniqueFields =
            this.nestedOperations.size === 1 &&
            this.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE) &&
            !relationshipTarget.uniqueFields.length;
        return this.nestedOperations.size > 0 && !onlyConnectOrCreateAndNoUniqueFields;
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
    public get subscriptionConnectedRelationshipFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) =>
            attribute.isSubscriptionConnectedRelationshipField()
        );
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

    public get createInputFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isCreateInputField());
    }

    public get updateInputFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isUpdateInputField());
    }

    public get sortableFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isSortableField());
    }

    public get whereFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isWhereField());
    }

    public get arrayMethodFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isArrayMethodField());
    }

    public get subscriptionWhereFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isSubscriptionWhereField());
    }
}
