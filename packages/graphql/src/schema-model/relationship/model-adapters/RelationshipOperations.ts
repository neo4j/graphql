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
import { upperFirst } from "../../../utils/upper-first";
import type { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "./RelationshipAdapter";
import { RelationshipBaseOperations } from "./RelationshipBaseOperations";

export class RelationshipOperations extends RelationshipBaseOperations<RelationshipAdapter> {
    constructor(relationship: RelationshipAdapter) {
        super(relationship);
    }

    protected get prefixForTypename(): string {
        // if relationship field is inherited  by source
        // (part of a implemented Interface, not necessarily annotated as rel)
        // then return this.interface.name

        return this.relationship.inheritedFrom || this.sourceName;
    }

    protected get fieldInputPrefixForTypename(): string {
        const isTargetInterface = isInterfaceEntity(this.target);
        if (isTargetInterface) {
            return this.sourceName;
        }
        return this.prefixForTypename;
    }

    protected get edgePrefix(): string {
        return this.relationship.propertiesTypeName ?? "";
    }

    public get subscriptionWhereInputTypeName(): string {
        return `${this.sourceName}${upperFirst(this.name)}RelationshipSubscriptionWhere`;
    }

    public getToUnionSubscriptionWhereInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.sourceName}${upperFirst(this.name)}${ifUnionRelationshipTargetEntity.name}SubscriptionWhere`;
    }

    public get subscriptionConnectedRelationshipTypeName(): string {
        return `${this.sourceName}${upperFirst(this.name)}ConnectedRelationship`;
    }

    public get edgeSubscriptionWhereInputTypeName(): string {
        return `${this.edgePrefix}SubscriptionWhere`;
    }
}
