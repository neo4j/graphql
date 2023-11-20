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

import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { ConnectionWhereArg, GraphQLWhereArg } from "../../../types";
import { fromGlobalId } from "../../../utils/global-ids";
import { asArray, filterTruthy, isObject, omitFields } from "../../../utils/utils";
import { isLogicalOperator } from "../../utils/logical-operators";
import type { RelationshipWhereOperator, WhereOperator } from "../../where/types";
import { ConnectionFilter } from "../ast/filters/ConnectionFilter";
import type { Filter } from "../ast/filters/Filter";
import { isRelationshipOperator } from "../ast/filters/Filter";
import { LogicalFilter } from "../ast/filters/LogicalFilter";
import { RelationshipFilter } from "../ast/filters/RelationshipFilter";
import { AggregationDurationFilter } from "../ast/filters/aggregation/AggregationDurationPropertyFilter";
import { AggregationFilter } from "../ast/filters/aggregation/AggregationFilter";
import { AggregationPropertyFilter } from "../ast/filters/aggregation/AggregationPropertyFilter";
import { CountFilter } from "../ast/filters/aggregation/CountFilter";
import { DurationFilter } from "../ast/filters/property-filters/DurationFilter";
import { PointFilter } from "../ast/filters/property-filters/PointFilter";
import { PropertyFilter } from "../ast/filters/property-filters/PropertyFilter";
import { getConcreteEntities } from "../utils/get-concrete-entities";
import { isConcreteEntity } from "../utils/is-concrete-entity";
import { isInterfaceEntity } from "../utils/is-interface-entity";
import { isUnionEntity } from "../utils/is-union-entity";
import type { QueryASTFactory } from "./QueryASTFactory";
import { parseAggregationWhereFields, parseConnectionWhereFields, parseWhereField } from "./parsers/parse-where-field";

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
    /**
     * Get all the entities explicitly required by the where "on" object. If it's a concrete entity it will return itself.
     **/
    private filterConcreteEntities(entity: EntityAdapter, where: ConnectionWhereArg): ConcreteEntityAdapter[] {
        if (isConcreteEntity(entity)) {
            return [entity];
        }
        const nodeOnWhere = isInterfaceEntity(entity) ? where.node?._on ?? {} : where;
        return entity.concreteEntities.filter((ce) => Object.keys(nodeOnWhere).some((key) => key === ce.name));
    }

    public createConnectionFilter(
        relationship: RelationshipAdapter,
        where: ConnectionWhereArg,
        filterOps: { isNot: boolean; operator: RelationshipWhereOperator | undefined }
    ): ConnectionFilter[] {
        if (isInterfaceEntity(relationship.target) && !where.node?._on) {
            // Optimization for interface entities, create a single connection filter for all the concrete entities, when no _on is specified.
            const connectionFilter = this.createConnectionFilterTreeNode({
                relationship: relationship,
                target: relationship.target,
                isNot: filterOps.isNot,
                operator: filterOps.operator,
            });
            const filters = this.createConnectionPredicates({ rel: relationship, entity: relationship.target, where });
            connectionFilter.addFilters(filters);
            return [connectionFilter];
        } else {
            const filteredEntities = this.filterConcreteEntities(relationship.target, where);
            const connectionFilters: ConnectionFilter[] = [];
            for (const concreteEntity of filteredEntities) {
                const connectionFilter = this.createConnectionFilterTreeNode({
                    relationship: relationship,
                    target: concreteEntity,
                    isNot: filterOps.isNot,
                    operator: filterOps.operator,
                });
                const filters = this.createConnectionPredicates({ rel: relationship, entity: concreteEntity, where });
                connectionFilter.addFilters(filters);
                connectionFilters.push(connectionFilter);
            }
            return connectionFilters;
        }
    }

    public createConnectionPredicates({
        rel,
        entity,
        where,
    }: {
        rel?: RelationshipAdapter;
        entity: EntityAdapter;
        where: GraphQLWhereArg | GraphQLWhereArg[];
    }): Filter[] {
        let entityWhere = where;
        if (rel && isUnionEntity(rel.target) && where[entity.name]) {
            entityWhere = where[entity.name];
        }
        const filters = asArray(entityWhere).flatMap((nestedWhere) => {
            return Object.entries(nestedWhere).flatMap(([key, value]: [string, GraphQLWhereArg]) => {
                if (isLogicalOperator(key)) {
                    const nestedFilters = this.createConnectionPredicates({ rel, entity, where: value });
                    return [
                        new LogicalFilter({
                            operation: key,
                            filters: filterTruthy(nestedFilters),
                        }),
                    ];
                }

                const connectionWhereField = parseConnectionWhereFields(key);
                if (rel && connectionWhereField.fieldName === "edge") {
                    return this.createEdgeFilters(rel, value);
                }
                if (connectionWhereField.fieldName === "node") {
                    return this.createNodeFilters(entity, value);
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
        if (attribute.typeHelper.isDuration()) {
            return new DurationFilter({
                attribute,
                comparisonValue,
                isNot,
                operator: filterOperator,
                attachedTo,
            });
        }
        if (attribute.typeHelper.isPoint() || attribute.typeHelper.isCartesianPoint()) {
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
            const targetNode = relationship.target;
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
    // This allow to override this creation in AuthorizationFilterFactory
    protected createConnectionFilterTreeNode(options: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter | InterfaceEntityAdapter;
        isNot: boolean;
        operator: RelationshipWhereOperator | undefined;
    }): ConnectionFilter {
        return new ConnectionFilter(options);
    }

    // TODO: rename and refactor this, createNodeFilters is misleading for non-connection operations
    public createNodeFilters(entity: EntityAdapter, where: Record<string, unknown>): Filter[] {
        const whereFields = this.getConcreteFiltersWhere(entity, where);

        const filters = filterTruthy(
            Object.entries(whereFields).flatMap(([key, value]): Filter | undefined => {
                if (key === "_on" && isObject(value)) {
                    return this.getConcreteFilter(entity, value);
                }

                if (isLogicalOperator(key)) {
                    return this.createNodeLogicalFilter(key, value, entity);
                }
                const { fieldName, operator, isNot, isConnection, isAggregate } = parseWhereField(key);

                let relationship: RelationshipAdapter | undefined;
                if (isConcreteEntity(entity)) {
                    relationship = entity.findRelationship(fieldName);
                }

                if (isConnection) {
                    if (!relationship) throw new Error(`Relationship not found for connection ${fieldName}`);
                    if (operator && !isRelationshipOperator(operator)) {
                        throw new Error(`Invalid operator ${operator} for relationship`);
                    }

                    const connectionFilters = this.createConnectionFilter(relationship, value as ConnectionWhereArg, {
                        isNot,
                        operator,
                    });
                    return this.wrapMultipleFiltersInLogical(connectionFilters)[0];
                }
                if (isAggregate) {
                    if (!relationship) throw new Error(`Relationship not found for connection ${fieldName}`);

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

                const attr = !isUnionEntity(entity) ? entity.findAttribute(fieldName) : undefined;

                if (fieldName === "id" && !attr && !isUnionEntity(entity)) {
                    const relayAttribute = entity.globalIdField;
                    if (relayAttribute) {
                        const relayIdData = fromGlobalId(value as string);
                        if (relayIdData) {
                            const { typeName, field } = relayIdData;
                            let id = relayIdData.id;

                            if (typeName !== entity.name || !field || !id) {
                                throw new Error(`Cannot query Relay Id on "${entity.name}"`);
                            }
                            const idAttribute = entity.findAttribute(field);
                            if (!idAttribute) throw new Error(`Attribute ${field} not found`);

                            if (idAttribute.typeHelper.isNumeric()) {
                                id = Number(id);
                                if (Number.isNaN(id)) {
                                    throw new Error("Can't parse non-numeric relay id");
                                }
                            }
                            return this.createPropertyFilter({
                                attribute: idAttribute,
                                comparisonValue: id,
                                isNot,
                                operator,
                            });
                        }
                    }
                }

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

    public createEdgeFilters(relationship: RelationshipAdapter, where: GraphQLWhereArg): Filter[] {
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
    }

    private createNodeLogicalFilter(
        operation: "OR" | "AND" | "NOT",
        where: GraphQLWhereArg[] | GraphQLWhereArg,
        entity: EntityAdapter
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
                const { fieldName, operator, isNot } = parseWhereField(key);

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

            const attachedTo = entity instanceof RelationshipAdapter ? "relationship" : "node";

            if (attr.typeHelper.isDuration()) {
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

    /** Returns an array of 0 or 1 elements with the filters wrapped using a logical operator if needed */
    private wrapMultipleFiltersInLogical<F extends Filter>(
        filters: F[],
        logicalOp: "AND" | "OR" = "AND"
    ): [F | LogicalFilter] | [] {
        if (filters.length > 1) {
            return [
                new LogicalFilter({
                    operation: logicalOp,
                    filters,
                }),
            ];
        }

        const singleFilter = filters[0];
        if (singleFilter) {
            return [singleFilter];
        }
        return [];
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

    private getConcreteFilter(entity: EntityAdapter, where: Record<string, any>): Filter | undefined {
        const concreteEntities = getConcreteEntities(entity);
        const nodeFilters: Filter[] = [];

        for (const concreteEntity of concreteEntities) {
            const concreteEntityWhere: Record<string, any> = where[concreteEntity.name];
            if (concreteEntityWhere) {
                const concreteEntityFilters = this.createNodeFilters(concreteEntity, concreteEntityWhere);
                nodeFilters.push(...concreteEntityFilters);
            }
        }
        return this.wrapMultipleFiltersInLogical(nodeFilters)[0];
    }

    private getConcreteFiltersWhere(entity: EntityAdapter, where: Record<string, any>): Record<string, any> {
        const concreteEntities = getConcreteEntities(entity);

        const whereOn = where["_on"] || {};
        const onFilters = concreteEntities.reduce((acc, concreteEntity) => {
            const concreteEntityWhere: Record<string, any> = whereOn[concreteEntity.name];

            return { ...acc, ...concreteEntityWhere };
        }, {});

        return omitFields({ ...where, ...onFilters }, ["_on"]);
    }
}
