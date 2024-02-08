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
import type { Annotations } from "../../annotation/Annotation";
import type { Attribute } from "../../attribute/Attribute";
import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import { RelationshipDeclarationAdapter } from "../../relationship/model-adapters/RelationshipDeclarationAdapter";
import type { RelationshipDeclaration } from "../../relationship/RelationshipDeclaration";
import { getFromMap } from "../../utils/get-from-map";
import { plural, singular } from "../../utils/string-manipulation";
import type { ConcreteEntity } from "../ConcreteEntity";
import type { InterfaceEntity } from "../InterfaceEntity";
import { ConcreteEntityAdapter } from "./ConcreteEntityAdapter";
import { InterfaceEntityOperations } from "./InterfaceEntityOperations";

export class InterfaceEntityAdapter {
    public readonly name: string;
    public concreteEntities: ConcreteEntityAdapter[];
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly relationshipDeclarations: Map<string, RelationshipDeclarationAdapter> = new Map();
    public readonly annotations: Partial<Annotations>;
    private uniqueFieldsKeys: string[] = [];

    private _singular: string | undefined;
    private _plural: string | undefined;

    // specialize models
    private _operations: InterfaceEntityOperations | undefined;

    constructor(entity: InterfaceEntity) {
        this.name = entity.name;
        this.concreteEntities = [];
        this.annotations = entity.annotations;
        this.initAttributes(entity.attributes);
        this.initRelationshipDeclarations(entity.relationshipDeclarations);
        this.initConcreteEntities(entity.concreteEntities);
    }

    public findAttribute(name: string): AttributeAdapter | undefined {
        return this.attributes.get(name);
    }

    public findRelationshipDeclarations(name: string): RelationshipDeclarationAdapter | undefined {
        return this.relationshipDeclarations.get(name);
    }

    get globalIdField(): AttributeAdapter | undefined {
        return undefined;
    }

    private initConcreteEntities(entities: ConcreteEntity[]) {
        for (const entity of entities) {
            const entityAdapter = new ConcreteEntityAdapter(entity);
            this.concreteEntities.push(entityAdapter);
        }
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
            if (attributeAdapter.isConstrainable() && attributeAdapter.isUnique()) {
                this.uniqueFieldsKeys.push(attribute.name);
            }
        }
    }

    private initRelationshipDeclarations(relationshipDeclarations: Map<string, RelationshipDeclaration>) {
        for (const [relationshipName, relationshipDeclaration] of relationshipDeclarations.entries()) {
            this.relationshipDeclarations.set(
                relationshipName,
                new RelationshipDeclarationAdapter(relationshipDeclaration, this)
            );
        }
    }
    get operations(): InterfaceEntityOperations {
        if (!this._operations) {
            return new InterfaceEntityOperations(this);
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
            if (this.annotations.plural) {
                this._plural = plural(this.annotations.plural.value);
            } else {
                this._plural = plural(this.name);
            }
        }
        return this._plural;
    }

    public get upperFirstPlural(): string {
        return upperFirst(this.plural);
    }

    get isReadable(): boolean {
        return this.annotations.query === undefined || this.annotations.query.read === true;
    }

    get isAggregable(): boolean {
        return this.annotations.query === undefined || this.annotations.query.aggregate === true;
    }

    /**
     * Categories
     * = a grouping of attributes
     * used to generate different types for the Entity that contains these Attributes
     */

    public get uniqueFields(): AttributeAdapter[] {
        return this.uniqueFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }

    public get sortableFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isSortableField());
    }

    public get whereFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isWhereField());
    }

    public get aggregableFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isAggregableField());
    }

    public get updateInputFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isUpdateInputField());
    }

    public get subscriptionEventPayloadFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isEventPayloadField());
    }
}
