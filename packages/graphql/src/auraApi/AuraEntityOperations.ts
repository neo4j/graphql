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
import type { ConcreteEntity } from "../schema-model/entity/ConcreteEntity";
import type { Entity } from "../schema-model/entity/Entity";
import type { Relationship } from "../schema-model/relationship/Relationship";
import { plural } from "../schema-model/utils/string-manipulation";

export interface GraphQLTypeNames {
    connectionOperation: string;
    connectionType: string;
    edgeType: string;
    nodeType: string;
    whereInputTypeName: string;
}

export class AuraEntityOperations implements GraphQLTypeNames {
    private readonly concreteEntity: ConcreteEntity;

    constructor(concreteEntity: ConcreteEntity) {
        this.concreteEntity = concreteEntity;
    }

    public relationship(relationship: Relationship): AuraRelationshipOperations {
        return new AuraRelationshipOperations(relationship);
    }

    public get connectionOperation(): string {
        return `${this.concreteEntity.name}Operation`;
    }

    public get connectionType(): string {
        return `${this.concreteEntity.name}Connection`;
    }

    public get edgeType(): string {
        return `${this.concreteEntity.name}Edge`;
    }

    public get nodeType(): string {
        return `${this.concreteEntity.name}`;
    }

    public get whereInputTypeName(): string {
        return `${this.concreteEntity.name}Where`;
    }

    public get queryField(): string {
        return this.plural;
    }

    public get plural(): string {
        return plural(this.concreteEntity.name);
    }
}

export class AuraRelationshipOperations implements GraphQLTypeNames {
    private parent: Entity;
    private relationship: Relationship;

    constructor(relationship: Relationship) {
        this.parent = relationship.source;
        this.relationship = relationship;
    }

    public get connectionOperation(): string {
        return `${this.relationshipTypePrefix}Operation`;
    }

    public get connectionType(): string {
        return `${this.relationshipTypePrefix}Connection`;
    }

    public get edgeType(): string {
        return `${this.relationshipTypePrefix}Edge`;
    }

    public get propertiesType(): string | undefined {
        return this.relationship.propertiesTypeName;
    }

    public get nodeType(): string {
        return `${this.relationshipTypePrefix}`;
    }

    public get whereInputTypeName(): string {
        return `${this.relationshipTypePrefix}Where`;
    }

    private get relationshipTypePrefix(): string {
        return `${this.parent.name}${upperFirst(this.relationship.name)}`;
    }
}
