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
import type { Entity } from "../../entity/Entity";
import { ConcreteEntityModel } from "../../entity/graphql-models/ConcreteEntityModel";
import type { RelationshipDirection } from "../Relationship";
import { AttributeModel } from "../../attribute/graphql-models/AttributeModel";
import type { Attribute } from "../../attribute/Attribute";
import { ConcreteEntity } from "../../entity/ConcreteEntity";
import { CompositeEntity } from "../../entity/CompositeEntity";

export class RelationshipModel {
    public readonly name: string;
    public readonly type: string;
    public readonly attributes: Map<string, AttributeModel> = new Map();
    public readonly source: ConcreteEntityModel;
    private rawEntity: Entity;
    private _target: Entity | undefined;
    public readonly direction: RelationshipDirection;

    /**Note: Required for now to infer the types without ResolveTree */
    public get connectionFieldTypename(): string {
        return `${this.source.name}${upperFirst(this.name)}Connection`;
    }

    /**Note: Required for now to infer the types without ResolveTree */
    public get relationshipFieldTypename(): string {
        return `${this.source.name}${upperFirst(this.name)}Relationship`;
    }

    constructor({
        name,
        type,
        attributes = new Map<string, Attribute>(),
        source,
        target,
        direction,
    }: {
        name: string;
        type: string;
        attributes?: Map<string, Attribute>;
        source: ConcreteEntityModel;
        target: Entity;
        direction: RelationshipDirection;
    }) {
        this.name = name;
        this.type = type;
        this.source = source;
        this.direction = direction;
        this.rawEntity = target;
        this.initAttributes(attributes);
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeModel = new AttributeModel(attribute);
            this.attributes.set(attributeName, attributeModel);
        }
    }

    // construct the target entity only when requested
    get target(): Entity {
        if (!this._target) {
            if (this.rawEntity instanceof ConcreteEntity) {
                this._target = new ConcreteEntityModel(this.rawEntity);
            } else if (this.rawEntity instanceof CompositeEntity) {
                this._target = new CompositeEntity(this.rawEntity);
            } else {
                throw new Error("invalid target entity type");
            }
        }
        return this._target;
    }
}
