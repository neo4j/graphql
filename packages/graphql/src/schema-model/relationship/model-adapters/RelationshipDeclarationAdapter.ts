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
import type { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import { ListFiltersAdapter } from "../../attribute/model-adapters/ListFiltersAdapter";
import type { Entity } from "../../entity/Entity";
import type { EntityAdapter } from "../../entity/EntityAdapter";
import { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import { InterfaceEntityAdapter } from "../../entity/model-adapters/InterfaceEntityAdapter";
import { UnionEntityAdapter } from "../../entity/model-adapters/UnionEntityAdapter";
import { getEntityAdapter } from "../../utils/get-entity-adapter";
import { plural, singular } from "../../utils/string-manipulation";
import type { NestedOperation } from "../Relationship";
import type { RelationshipDeclaration } from "../RelationshipDeclaration";
import { RelationshipAdapter } from "./RelationshipAdapter";
import { RelationshipDeclarationOperations } from "./RelationshipDeclarationOperations";

export class RelationshipDeclarationAdapter {
    private _listFiltersModel: ListFiltersAdapter | undefined;
    public readonly name: string;
    public readonly source: EntityAdapter;
    private rawEntity: Entity;
    private _target: EntityAdapter | undefined;
    public readonly nestedOperations: Set<NestedOperation>;
    public readonly aggregate: boolean;
    public readonly isNullable: boolean;
    public readonly description?: string;
    public readonly isList: boolean;
    public readonly annotations: Partial<Annotations>;
    public readonly args: Argument[];
    public readonly relationshipImplementations: RelationshipAdapter[];

    public readonly firstDeclaredInTypeName: string | undefined;

    private _singular: string | undefined;
    private _plural: string | undefined;

    // specialize models
    private _operations: RelationshipDeclarationOperations | undefined;

    constructor(relationshipDeclaration: RelationshipDeclaration, sourceAdapter?: EntityAdapter) {
        const {
            name,
            args,
            source,
            target,
            isList,
            nestedOperations,
            aggregate,
            isNullable,
            description,
            annotations,
            firstDeclaredInTypeName,
        } = relationshipDeclaration;
        this.name = name;
        this.args = args;
        if (sourceAdapter) {
            this.source = sourceAdapter;
        } else {
            this.source = getEntityAdapter(source);
        }
        this.isList = isList;
        this.nestedOperations = new Set(nestedOperations);
        this.aggregate = aggregate;
        this.isNullable = isNullable;
        this.rawEntity = target;
        this.description = description;
        this.annotations = annotations;
        this.relationshipImplementations = relationshipDeclaration.relationshipImplementations.map(
            (r) => new RelationshipAdapter(r)
        );
        this.firstDeclaredInTypeName = firstDeclaredInTypeName;
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

    public get operations(): RelationshipDeclarationOperations {
        if (!this._operations) {
            return new RelationshipDeclarationOperations(this);
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

    // construct the target entity only when requested
    public get target(): EntityAdapter {
        if (!this._target) {
            this._target = getEntityAdapter(this.rawEntity);
        }
        return this._target;
    }

    public get nonGeneratedProperties(): AttributeAdapter[] {
        return this.relationshipImplementations.flatMap((impl) =>
            Array.from(impl.attributes.values()).filter((attribute) => attribute.isNonGeneratedField())
        );
    }
    public get hasNonNullNonGeneratedProperties(): boolean {
        return this.nonGeneratedProperties.some((property) => property.typeHelper.isRequired());
    }

    public get hasAnyProperties(): boolean {
        return !!this.relationshipImplementations.find((relationshipImpl) => relationshipImpl.hasAnyProperties);
    }

    public get hasCreateInputFields(): boolean {
        return !!this.relationshipImplementations.find((impl) => impl.hasCreateInputFields);
    }
    public get hasUpdateInputFields(): boolean {
        return !!this.relationshipImplementations.find((impl) => impl.hasUpdateInputFields);
    }
    public get hasNonNullCreateInputFields(): boolean {
        return !!this.relationshipImplementations.find((impl) => impl.hasNonNullCreateInputFields);
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

    public findRelationshipImplementation(relationshipName: string): RelationshipAdapter | undefined {
        return this.relationshipImplementations.find((impl) => impl.name === relationshipName);
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
}
