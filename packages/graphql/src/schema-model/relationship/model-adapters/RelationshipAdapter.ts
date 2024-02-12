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

import { RelationshipNestedOperationsOption } from "../../../constants";
import type { Annotations } from "../../annotation/Annotation";
import type { Argument } from "../../argument/Argument";
import type { Attribute } from "../../attribute/Attribute";
import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import { ListFiltersAdapter } from "../../attribute/model-adapters/ListFiltersAdapter";
import { ConcreteEntity } from "../../entity/ConcreteEntity";
import type { Entity } from "../../entity/Entity";
import type { EntityAdapter } from "../../entity/EntityAdapter";
import { InterfaceEntity } from "../../entity/InterfaceEntity";
import { UnionEntity } from "../../entity/UnionEntity";
import { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../entity/model-adapters/UnionEntityAdapter";
import { plural, singular } from "../../utils/string-manipulation";
import type { NestedOperation, QueryDirection, Relationship, RelationshipDirection } from "../Relationship";
import { RelationshipOperations } from "./RelationshipOperations";
import { Memoize } from "typescript-memoize";

export class RelationshipAdapter {
    private _listFiltersModel: ListFiltersAdapter | undefined;
    public readonly name: string;
    public readonly type: string;
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly source: EntityAdapter;
    private rawEntity: Entity;
    private rawOriginalTargetEntity?: Entity;
    private _target: EntityAdapter | undefined;
    public readonly direction: RelationshipDirection;
    public readonly queryDirection: QueryDirection;
    public readonly nestedOperations: Set<NestedOperation>;
    public readonly aggregate: boolean;
    public readonly isNullable: boolean;
    public readonly description?: string;
    public readonly propertiesTypeName: string | undefined;
    public readonly firstDeclaredInTypeName: string | undefined;
    public readonly isList: boolean;
    public readonly annotations: Partial<Annotations>;
    public readonly args: Argument[];

    public readonly siblings?: string[];

    private _singular: string | undefined;
    private _plural: string | undefined;

    // specialize models
    private _operations: RelationshipOperations | undefined;

    constructor(relationship: Relationship, sourceAdapter?: EntityAdapter) {
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
            firstDeclaredInTypeName,
            originalTarget,
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
        this.firstDeclaredInTypeName = firstDeclaredInTypeName;
        this.rawOriginalTargetEntity = originalTarget;

        if (relationship.getSiblings()) {
            this.siblings = relationship.getSiblings();
        }
    }

    public get operations(): RelationshipOperations {
        if (!this._operations) {
            return new RelationshipOperations(this);
        }
        return this._operations;
    }
    public get listFiltersModel(): ListFiltersAdapter | undefined {
        if (!this._listFiltersModel) {
            if (!this.isList) {
                return;
            }
            this._listFiltersModel = new ListFiltersAdapter(this);
        }
        return this._listFiltersModel;
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
    @Memoize()
    public get target(): EntityAdapter {
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

    @Memoize()
    public get originalTarget(): EntityAdapter | undefined {
        if (!this.rawOriginalTargetEntity) {
            return;
        }
        if (this.rawOriginalTargetEntity instanceof ConcreteEntity) {
            return new ConcreteEntityAdapter(this.rawOriginalTargetEntity);
        } else if (this.rawOriginalTargetEntity instanceof InterfaceEntity) {
            return new InterfaceEntityAdapter(this.rawOriginalTargetEntity);
        } else if (this.rawOriginalTargetEntity instanceof UnionEntity) {
            return new UnionEntityAdapter(this.rawOriginalTargetEntity);
        } else {
            throw new Error("invalid original target entity type");
        }
    }

    public isReadable(): boolean {
        return this.annotations.selectable?.onRead !== false;
    }

    public isFilterableByValue(): boolean {
        return this.annotations.filterable?.byValue !== false;
    }

    public isFilterableByAggregate(): boolean {
        return this.annotations.filterable?.byAggregate !== false;
    }

    public isAggregable(): boolean {
        return this.annotations.selectable?.onAggregate !== false;
    }

    public isCreatable(): boolean {
        return this.annotations.settable?.onCreate !== false;
    }

    public isUpdatable(): boolean {
        return this.annotations.settable?.onUpdate !== false;
    }

    public shouldGenerateFieldInputType(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): boolean {
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

    public shouldGenerateUpdateFieldInputType(ifUnionRelationshipTargetEntity?: ConcreteEntityAdapter): boolean {
        const onlyConnectOrCreate =
            this.nestedOperations.size === 1 &&
            this.nestedOperations.has(RelationshipNestedOperationsOption.CONNECT_OR_CREATE);

        if (this.target instanceof InterfaceEntityAdapter) {
            return this.nestedOperations.size > 0 && !onlyConnectOrCreate;
        }
        if (this.target instanceof UnionEntityAdapter) {
            if (!ifUnionRelationshipTargetEntity) {
                throw new Error("Expected member entity");
            }
            const onlyConnectOrCreateAndNoUniqueFields =
                onlyConnectOrCreate && !ifUnionRelationshipTargetEntity.uniqueFields.length;
            return this.nestedOperations.size > 0 && !onlyConnectOrCreateAndNoUniqueFields;
        }
        const onlyConnectOrCreateAndNoUniqueFields = onlyConnectOrCreate && !this.target.uniqueFields.length;
        return this.nestedOperations.size > 0 && !onlyConnectOrCreateAndNoUniqueFields;
    }

    public get hasNonNullCreateInputFields(): boolean {
        return this.createInputFields.some((property) => property.typeHelper.isRequired());
    }
    public get hasCreateInputFields(): boolean {
        return this.createInputFields.length > 0;
    }
    public get hasUpdateInputFields(): boolean {
        return this.updateInputFields.length > 0;
    }
    public get hasAnyProperties(): boolean {
        return this.propertiesTypeName !== undefined;
    }

    /**
     * Categories
     * = a grouping of attributes
     * used to generate different types for the Entity that contains these Attributes
     */

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

    public get subscriptionConnectedRelationshipFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) =>
            attribute.isSubscriptionConnectedRelationshipField()
        );
    }
}
