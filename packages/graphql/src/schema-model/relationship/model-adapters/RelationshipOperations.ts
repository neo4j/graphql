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
import type { ConcreteEntityAdapter } from "../../entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "./RelationshipAdapter";
import { RelationshipBaseOperations } from "./RelationshipBaseOperations";

export class RelationshipOperations extends RelationshipBaseOperations<RelationshipAdapter> {
    constructor(relationship: RelationshipAdapter) {
        super(relationship);
    }

    protected get fieldInputPrefixForTypename(): string {
        const isTargetInterface = isInterfaceEntity(this.relationship.target);
        if (isTargetInterface) {
            return this.relationship.source.name;
        }
        return this.relationship.firstDeclaredInTypeName || this.relationship.source.name;
    }

    protected get edgePrefix(): string {
        return this.relationship.propertiesTypeName ?? "";
    }

    public get subscriptionWhereInputTypeName(): string {
        return `${this.prefixForTypename}RelationshipSubscriptionWhere`;
    }

    public getToUnionSubscriptionWhereInputTypeName(ifUnionRelationshipTargetEntity: ConcreteEntityAdapter): string {
        return `${this.prefixForTypename}${ifUnionRelationshipTargetEntity.name}SubscriptionWhere`;
    }

    public get subscriptionConnectedRelationshipTypeName(): string {
        return `${this.prefixForTypename}ConnectedRelationship`;
    }

    public get edgeSubscriptionWhereInputTypeName(): string {
        return `${this.edgePrefix}SubscriptionWhere`;
    }
}
