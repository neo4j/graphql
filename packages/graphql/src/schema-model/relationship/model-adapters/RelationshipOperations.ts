/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

    public get relationshipFiltersTypeName(): string {
        return `${this.relationship.target.name}RelationshipFilters`;
    }

    public get connectionFiltersTypeName(): string {
        return `${this.prefixForTypename}ConnectionFilters`;
    }
}
