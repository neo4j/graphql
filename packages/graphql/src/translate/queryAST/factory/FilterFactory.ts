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

import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";

import { PropertyFilter } from "../ast/filters/property-filters/PropertyFilter";
import type { Filter } from "../ast/filters/Filter";
import { isRelationshipOperator } from "../ast/filters/Filter";
import type { QueryASTFactory } from "./QueryASTFactory";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { parseConnectionWhereFields, parseWhereField } from "./parsers/parse-where-field";
import type { ConnectionWhereArg, GraphQLWhereArg } from "../../../types";
import { RelationshipFilter } from "../ast/filters/RelationshipFilter";
import type { RelationshipWhereOperator, WhereOperator } from "../../where/types";
import { LogicalFilter } from "../ast/filters/LogicalFilter";
import { asArray, filterTruthy } from "../../../utils/utils";
import { ConnectionFilter } from "../ast/filters/connection/ConnectionFilter";
import { ConnectionNodeFilter } from "../ast/filters/connection/ConnectionNodeFilter";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import { AttributeType } from "../../../schema-model/attribute/Attribute";
import { DurationFilter } from "../ast/filters/property-filters/DurationFilter";
import { PointFilter } from "../ast/filters/property-filters/PointFilter";
import { isInArray } from "../../../utils/is-in-array";
import { ConnectionEdgeFilter } from "../ast/filters/connection/ConnectionEdgeFilter";

export class FilterFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createRelationshipFilters(relationship: Relationship, where: Record<string, unknown>): Array<Filter> {
        return Object.entries(where).map(([key, value]): Filter => {
            if (["NOT", "OR", "AND"].includes(key)) {
                return this.createEdgeLogicalFilter(key as "NOT" | "OR" | "AND", value as any, relationship);
            }
            const { fieldName, operator, isNot } = parseWhereField(key);
            const attr = relationship.findAttribute(fieldName);
            if (!attr) throw new Error(`Attribute ${fieldName} not found`);
            return this.createPropertyFilter({
                attribute: attr,
                comparisonValue: value,
                isNot,
                operator,
            });
        });
    }

    private createPropertyFilter({
        attribute,
        comparisonValue,
        operator,
        isNot,
    }: {
        attribute: Attribute;
        comparisonValue: unknown;
        operator: WhereOperator | undefined;
        isNot: boolean;
    }): PropertyFilter {
        const filterOperator = operator || "EQ";
        switch (attribute.type) {
            case AttributeType.Duration: {
                return new DurationFilter({
                    attribute,
                    comparisonValue,
                    isNot,
                    operator: filterOperator,
                });
            }
            case AttributeType.Point: {
                return new PointFilter({
                    attribute,
                    comparisonValue,
                    isNot,
                    operator: filterOperator,
                });
            }
        }

        return new PropertyFilter({
            attribute,
            comparisonValue,
            isNot,
            operator: filterOperator,
        });
    }

    private createRelationshipFilter(
        where: GraphQLWhereArg,
        relationship: Relationship,
        filterOps: { isNot: boolean; operator: RelationshipWhereOperator | undefined }
    ): RelationshipFilter {
        const relationshipFilter = new RelationshipFilter({
            relationship: relationship,
            isNot: filterOps.isNot,
            operator: filterOps.operator || "SOME",
        });

        const targetNode = relationship.target as ConcreteEntity; // TODO: accept entities
        const targetNodeFilters = this.createNodeFilters(targetNode, where);

        relationshipFilter.addTargetNodeFilter(...targetNodeFilters);

        return relationshipFilter;
    }

    public createConnectionFilter(
        relationship: Relationship,
        where: ConnectionWhereArg,
        filterOps: { isNot: boolean; operator: RelationshipWhereOperator | undefined }
    ): ConnectionFilter {
        const connectionFilter = new ConnectionFilter({
            relationship: relationship,
            isNot: filterOps.isNot,
            operator: filterOps.operator,
        });

        const targetNode = relationship.target as ConcreteEntity; // TODO: accept entities

        Object.entries(where).forEach(([key, value]: [string, GraphQLWhereArg | GraphQLWhereArg[]]) => {
            if (isInArray(["NOT", "OR", "AND"] as const, key)) {
                connectionFilter.addConnectionFilter(this.createConnectionLogicalFilter(key, value, relationship));
            }
            const connectionWhereField = parseConnectionWhereFields(key);
            if (connectionWhereField.fieldName === "edge") {
                const targetEdgeFilters = this.createEdgeFilters(relationship, value);
                const connectionEdgeFilter = new ConnectionEdgeFilter({
                    isNot: connectionWhereField.isNot,
                    filters: targetEdgeFilters,
                });
                connectionFilter.addConnectionEdgeFilter(connectionEdgeFilter);
            }
            if (connectionWhereField.fieldName === "node") {
                const targetNodeFilters = this.createNodeFilters(targetNode, value as any);
                const connectionNodeFilter = new ConnectionNodeFilter({
                    isNot: connectionWhereField.isNot,
                    filters: targetNodeFilters,
                });
                connectionFilter.addConnectionNodeFilter(connectionNodeFilter);
            }
        });

        return connectionFilter;
    }

    public createNodeFilters(entity: ConcreteEntity, where: Record<string, unknown>): Array<Filter> {
        return Object.entries(where).map(([key, value]): Filter => {
            if (isInArray(["NOT", "OR", "AND"] as const, key)) {
                return this.createNodeLogicalFilter(key, value as any, entity);
            }
            const { fieldName, operator, isNot, isConnection } = parseWhereField(key);
            const relationship = entity.findRelationship(fieldName);

            if (isConnection) {
                if (!relationship) throw new Error(`Relationship not found for connection ${fieldName}`);
                if (operator && !isRelationshipOperator(operator)) {
                    throw new Error(`Invalid operator ${operator} for relationship`);
                }

                return this.createConnectionFilter(relationship, value as ConnectionWhereArg, {
                    isNot,
                    operator,
                });
            }

            if (relationship) {
                if (operator && !isRelationshipOperator(operator)) {
                    throw new Error(`Invalid operator ${operator} for relationship`);
                }

                return this.createRelationshipFilter(value as GraphQLWhereArg, relationship, {
                    isNot,
                    operator,
                });
            }

            const attr = entity.findAttribute(fieldName);
            if (!attr) throw new Error(`Attribute ${fieldName} not found`);
            return this.createPropertyFilter({
                attribute: attr,
                comparisonValue: value,
                isNot,
                operator,
            });
        });
    }

    private createEdgeFilters(relationship: Relationship, where: GraphQLWhereArg): Array<Filter> {
        const filterASTs = Object.entries(where).map(([prop, value]): Filter => {
            if (["NOT", "OR", "AND"].includes(prop)) {
                return this.createEdgeLogicalFilter(prop as "NOT" | "OR" | "AND", value, relationship);
            }
            const { fieldName, operator, isNot } = parseWhereField(prop);
            const attribute = relationship.findAttribute(fieldName);
            if (!attribute) throw new Error(`no filter attribute ${prop}`);

            return this.createPropertyFilter({
                attribute,
                comparisonValue: value,
                isNot,
                operator,
            });
        });

        return filterTruthy(filterASTs);
    }

    private createConnectionLogicalFilter(
        operation: "OR" | "AND" | "NOT",
        where: GraphQLWhereArg[] | GraphQLWhereArg,
        entity: Relationship
    ): Filter {
        const nestedFilters = asArray(where).flatMap((nestedWhere) => {
            return Object.entries(nestedWhere).map(([key, value]: [string, GraphQLWhereArg | GraphQLWhereArg[]]) => {
                if (isInArray(["NOT", "OR", "AND"] as const, key)) {
                    return this.createConnectionLogicalFilter(key, value, entity);
                }
                const connectionWhereField = parseConnectionWhereFields(key);
                if (connectionWhereField.fieldName === "edge") {
                    const targetEdgeFilters = this.createEdgeFilters(entity, value);
                    const connectionEdgeFilter = new ConnectionEdgeFilter({
                        isNot: connectionWhereField.isNot,
                        filters: targetEdgeFilters,
                    });
                    return connectionEdgeFilter as Filter;
                }
                if (connectionWhereField.fieldName === "node") {
                    const targetNodeFilters = this.createNodeFilters(entity.target as ConcreteEntity, value as any);
                    const connectionNodeFilter = new ConnectionNodeFilter({
                        isNot: connectionWhereField.isNot,
                        filters: targetNodeFilters,
                    });
                    return connectionNodeFilter as Filter;
                }
            });
        });
        return new LogicalFilter({
            operation,
            filters: filterTruthy(nestedFilters),
        });
    }

    private createNodeLogicalFilter(
        operation: "OR" | "AND" | "NOT",
        where: GraphQLWhereArg[] | GraphQLWhereArg,
        entity: ConcreteEntity
    ): LogicalFilter {
        const nestedFilters = asArray(where).flatMap((nestedWhere) => {
            return this.createNodeFilters(entity, nestedWhere);
        });
        return new LogicalFilter({
            operation,
            filters: nestedFilters,
        });
    }

    private createEdgeLogicalFilter(
        operation: "OR" | "AND" | "NOT",
        where: GraphQLWhereArg[] | GraphQLWhereArg,
        relationship: Relationship
    ): LogicalFilter {
        const nestedFilters = asArray(where).flatMap((nestedWhere) => {
            return this.createEdgeFilters(relationship, nestedWhere);
        });
        return new LogicalFilter({
            operation,
            filters: nestedFilters,
        });
    }
}
