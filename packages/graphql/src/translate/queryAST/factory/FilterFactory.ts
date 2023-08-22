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

import { PropertyFilter } from "../ast/filters/property-filters/PropertyFilter";
import type { Filter } from "../ast/filters/Filter";
import { isRelationshipOperator } from "../ast/filters/Filter";
import type { QueryASTFactory } from "./QueryASTFactory";
import { parseAggregationWhereFields, parseConnectionWhereFields, parseWhereField } from "./parsers/parse-where-field";
import type { ConnectionWhereArg, GraphQLWhereArg } from "../../../types";
import { RelationshipFilter } from "../ast/filters/RelationshipFilter";
import type { RelationshipWhereOperator, WhereOperator } from "../../where/types";
import { LogicalFilter } from "../ast/filters/LogicalFilter";
import { asArray, filterTruthy } from "../../../utils/utils";
import { ConnectionFilter } from "../ast/filters/ConnectionFilter";
import { DurationFilter } from "../ast/filters/property-filters/DurationFilter";
import { PointFilter } from "../ast/filters/property-filters/PointFilter";
import { AggregationFilter } from "../ast/filters/aggregation/AggregationFilter";
import { CountFilter } from "../ast/filters/aggregation/CountFilter";
import { AggregationPropertyFilter } from "../ast/filters/aggregation/AggregationPropertyFilter";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { isLogicalOperator } from "../../utils/logical-operators";
import { AggregationDurationFilter } from "../ast/filters/aggregation/AggregationDurationPropertyFilter";

type AggregateWhereInput = {
    count: number;
    count_LT: number;
    count_LTE: number;
    count_GT: number;
    count_GTE: number;
    node: Record<string, any>;
    edge: Record<string, any>;
};

export class FilterFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createRelationshipFilters(relationship: RelationshipAdapter, where: Record<string, unknown>): Array<Filter> {
        return Object.entries(where).map(([key, value]): Filter => {
            if (isLogicalOperator(key)) {
                return this.createEdgeLogicalFilter(key, value as any, relationship);
            }
            const { fieldName, operator, isNot } = parseWhereField(key);
            const attr = relationship.findAttribute(fieldName);
            if (!attr) throw new Error(`Attribute ${fieldName} not found`);
            return this.createPropertyFilter({
                attribute: attr,
                comparisonValue: value,
                isNot,
                operator,
                attachedTo: "relationship",
            });
        });
    }

    public createConnectionFilter(
        relationship: RelationshipAdapter,
        where: ConnectionWhereArg,
        filterOps: { isNot: boolean; operator: RelationshipWhereOperator | undefined }
    ): ConnectionFilter {
        const connectionFilter = new ConnectionFilter({
            relationship: relationship,
            isNot: filterOps.isNot,
            operator: filterOps.operator,
        });

        const filters = this.createConnectionPredicates(relationship, where);
        connectionFilter.addFilters(filters);
        return connectionFilter;
    }

    public createConnectionPredicates(rel: RelationshipAdapter, where: GraphQLWhereArg | GraphQLWhereArg[]): Filter[] {
        const filters = asArray(where).flatMap((nestedWhere) => {
            return Object.entries(nestedWhere).flatMap(([key, value]: [string, GraphQLWhereArg]) => {
                if (isLogicalOperator(key)) {
                    const nestedFilters = this.createConnectionPredicates(rel, value);
                    return [
                        new LogicalFilter({
                            operation: key,
                            filters: filterTruthy(nestedFilters),
                        }),
                    ];
                }

                const connectionWhereField = parseConnectionWhereFields(key);
                if (connectionWhereField.fieldName === "edge") {
                    return this.createEdgeFilters(rel, value);
                }
                if (connectionWhereField.fieldName === "node") {
                    return this.createNodeFilters(rel.target as ConcreteEntityAdapter, value);
                }
            });
        });
        return filterTruthy(filters);
    }

    protected createPropertyFilter({
        attribute,
        comparisonValue,
        operator,
        isNot,
        attachedTo,
    }: {
        attribute: AttributeAdapter;
        comparisonValue: unknown;
        operator: WhereOperator | undefined;
        isNot: boolean;
        attachedTo?: "node" | "relationship";
    }): PropertyFilter {
        const filterOperator = operator || "EQ";
        if (attribute.isDuration()) {
            return new DurationFilter({
                attribute,
                comparisonValue,
                isNot,
                operator: filterOperator,
                attachedTo,
            });
        }
        if (attribute.isPoint()) {
            return new PointFilter({
                attribute,
                comparisonValue,
                isNot,
                operator: filterOperator,
                attachedTo,
            });
        }

        return new PropertyFilter({
            attribute,
            comparisonValue,
            isNot,
            operator: filterOperator,
            attachedTo,
        });
    }

    private createRelationshipFilter(
        where: GraphQLWhereArg,
        relationship: RelationshipAdapter,
        filterOps: { isNot: boolean; operator: RelationshipWhereOperator | undefined }
    ): RelationshipFilter | undefined {
        /**
         * The logic below can be confusing, but it's to handle the following cases:
         * 1. where: { actors: null } -> in this case we want to return an Exists filter as showed by tests packages/graphql/tests/tck/null.test.ts
         * 2. where: {} -> in this case we want to not apply any filter, as showed by tests packages/graphql/tests/tck/issues/402.test.ts
         **/
        const isNull = where === null;
        if (!isNull && Object.keys(where).length === 0) {
            return;
        }
        // this is because if isNull it's true we want to wrap the Exist subclause in a NOT, but if it's isNull it's true and isNot it's true they negate each other
        const isNot = isNull ? !filterOps.isNot : filterOps.isNot;

        const relationshipFilter = this.createRelationshipFilterTreeNode({
            relationship: relationship,
            isNot,
            operator: filterOps.operator || "SOME",
        });

        if (!isNull) {
            const targetNode = relationship.target as ConcreteEntityAdapter; // TODO: accept entities
            const targetNodeFilters = this.createNodeFilters(targetNode, where);
            relationshipFilter.addTargetNodeFilter(...targetNodeFilters);
        }

        return relationshipFilter;
    }

    // This allow to override this creation in AuthorizationFilterFactory
    protected createRelationshipFilterTreeNode(options: {
        relationship: RelationshipAdapter;
        isNot: boolean;
        operator: RelationshipWhereOperator;
    }): RelationshipFilter {
        return new RelationshipFilter(options);
    }

    // TODO: rename and refactor this, createNodeFilters is misleading for non-connection operations
    public createNodeFilters(entity: ConcreteEntityAdapter, where: Record<string, unknown>): Filter[] {
        const filters = filterTruthy(
            Object.entries(where).map(([key, value]): Filter | undefined => {
                if (isLogicalOperator(key)) {
                    return this.createNodeLogicalFilter(key, value as any, entity);
                }
                const { fieldName, operator, isNot, isConnection, isAggregate } = parseWhereField(key);
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
                if (isAggregate) {
                    if (!relationship) throw new Error(`Relationship not found for connection ${fieldName}`);
                    // if (operator && !isRelationshipOperator(operator)) {
                    //     throw new Error(`Invalid operator ${operator} for relationship`);
                    // }
                    return this.createAggregationFilter(value as AggregateWhereInput, relationship);
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
            })
        );

        return this.wrapMultipleFiltersInLogical(filters);
    }

    private createEdgeFilters(relationship: RelationshipAdapter, where: GraphQLWhereArg): Filter[] {
        const filterASTs = Object.entries(where).map(([key, value]): Filter => {
            if (isLogicalOperator(key)) {
                return this.createEdgeLogicalFilter(key, value, relationship);
            }
            const { fieldName, operator, isNot } = parseWhereField(key);
            const attribute = relationship.findAttribute(fieldName);
            if (!attribute) throw new Error(`no filter attribute ${key}`);

            return this.createPropertyFilter({
                attribute,
                comparisonValue: value,
                isNot,
                operator,
                attachedTo: "relationship",
            });
        });

        return this.wrapMultipleFiltersInLogical(filterTruthy(filterASTs));
        // return filterTruthy(filterASTs);
    }

    private createNodeLogicalFilter(
        operation: "OR" | "AND" | "NOT",
        where: GraphQLWhereArg[] | GraphQLWhereArg,
        entity: ConcreteEntityAdapter
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
        relationship: RelationshipAdapter
    ): LogicalFilter {
        const nestedFilters = asArray(where).flatMap((nestedWhere) => {
            return this.createEdgeFilters(relationship, nestedWhere);
        });
        return new LogicalFilter({
            operation,
            filters: nestedFilters,
        });
    }

    private getAggregationNestedFilters(
        where: AggregateWhereInput,
        relationship: RelationshipAdapter
    ): Array<AggregationPropertyFilter | CountFilter | LogicalFilter> {
        const nestedFilters = Object.entries(where).flatMap(
            ([key, value]): Array<AggregationPropertyFilter | CountFilter | LogicalFilter> => {
                if (isLogicalOperator(key)) {
                    const nestedFilters = asArray(value).flatMap((nestedWhere) => {
                        return this.getAggregationNestedFilters(nestedWhere, relationship);
                    });

                    const logicalFilter = new LogicalFilter({
                        operation: key,
                        filters: nestedFilters,
                    });
                    return [logicalFilter];
                }
                const { fieldName, operator, isNot, isConnection, isAggregate } = parseWhereField(key);

                const filterOperator = operator || "EQ";
                if (fieldName === "count") {
                    const countFilter = new CountFilter({
                        operator: filterOperator,
                        isNot,
                        comparisonValue: value,
                    });
                    return [countFilter];
                }

                if (fieldName === "node") {
                    return this.createAggregationNodeFilters(
                        value as Record<string, any>,
                        relationship.target as ConcreteEntityAdapter
                    );
                }

                if (fieldName === "edge") {
                    return this.createAggregationNodeFilters(value as Record<string, any>, relationship);
                }

                throw new Error(`Aggregation filter not found ${key}`);
            }
        );

        return this.wrapMultipleFiltersInLogical(nestedFilters);
    }

    private createAggregationFilter(where: AggregateWhereInput, relationship: RelationshipAdapter): AggregationFilter {
        const aggregationFilter = new AggregationFilter(relationship);
        const nestedFilters = this.getAggregationNestedFilters(where, relationship);
        aggregationFilter.addFilters(...nestedFilters);

        return aggregationFilter;
    }

    private createAggregationNodeFilters(
        where: Record<string, any>,
        entity: ConcreteEntityAdapter | RelationshipAdapter
    ): Array<AggregationPropertyFilter | LogicalFilter> {
        const filters = Object.entries(where).map(([key, value]) => {
            if (isLogicalOperator(key)) {
                return this.createAggregateLogicalFilter(key, value, entity);
            }
            // NOTE: if aggregationOperator is undefined, maybe we could return a normal PropertyFilter instead
            const { fieldName, logicalOperator, aggregationOperator } = parseAggregationWhereFields(key);

            const attr = entity.findAttribute(fieldName);
            if (!attr) throw new Error(`Attribute ${fieldName} not found`);

            // const filterOperator = operator || "EQ";
            const attachedTo = entity instanceof RelationshipAdapter ? "relationship" : "node";

            if (attr.isDuration()) {
                return new AggregationDurationFilter({
                    attribute: attr,
                    comparisonValue: value,
                    logicalOperator: logicalOperator || "EQUAL",
                    aggregationOperator: aggregationOperator,
                    attachedTo,
                });
            }

            return new AggregationPropertyFilter({
                attribute: attr,
                comparisonValue: value,
                logicalOperator: logicalOperator || "EQUAL",
                aggregationOperator: aggregationOperator,
                attachedTo,
            });
        });

        return this.wrapMultipleFiltersInLogical(filters);
    }

    private wrapMultipleFiltersInLogical<F extends Filter>(
        filters: F[],
        logicalOp: "AND" | "OR" = "AND"
    ): Array<F | LogicalFilter> {
        if (filters.length > 1) {
            return [
                new LogicalFilter({
                    operation: logicalOp,
                    filters,
                }),
            ];
        }
        return filters;
    }

    private createAggregateLogicalFilter(
        operation: "OR" | "AND" | "NOT",
        where: GraphQLWhereArg[] | GraphQLWhereArg,
        entity: ConcreteEntityAdapter | RelationshipAdapter
    ): LogicalFilter {
        const filters = asArray(where).flatMap((nestedWhere) => {
            return this.createAggregationNodeFilters(nestedWhere, entity);
        });
        return new LogicalFilter({
            operation,
            filters,
        });
    }
}
