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
import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { getEntityAdapter } from "../../../schema-model/utils/get-entity-adapter";
import type { ConnectionWhereArg, GraphQLWhereArg } from "../../../types";
import { fromGlobalId } from "../../../utils/global-ids";
import { asArray, filterTruthy } from "../../../utils/utils";
import { isLogicalOperator } from "../../utils/logical-operators";
import { ConnectionFilter } from "../ast/filters/ConnectionFilter";
import { CypherOneToOneRelationshipFilter } from "../ast/filters/CypherOneToOneRelationshipFilter";
import { CypherRelationshipFilter } from "../ast/filters/CypherRelationshipFilter";
import type { Filter, FilterOperator, RelationshipWhereOperator } from "../ast/filters/Filter";
import { isLegacyRelationshipOperator } from "../ast/filters/Filter";
import { LogicalFilter } from "../ast/filters/LogicalFilter";
import { RelationshipFilter } from "../ast/filters/RelationshipFilter";
import { AggregationDateTimeFilter } from "../ast/filters/aggregation/AggregationDateTimePropertyFilter";
import { AggregationDurationFilter } from "../ast/filters/aggregation/AggregationDurationPropertyFilter";
import { AggregationPropertyFilter } from "../ast/filters/aggregation/AggregationPropertyFilter";
import { AggregationTimeFilter } from "../ast/filters/aggregation/AggregationTimePropertyFilter";
import { CountFilter } from "../ast/filters/aggregation/CountFilter";
import { CypherFilter } from "../ast/filters/property-filters/CypherFilter";
import { DateTimeFilter } from "../ast/filters/property-filters/DateTimeFilter";
import { DurationFilter } from "../ast/filters/property-filters/DurationFilter";
import { PointFilter } from "../ast/filters/property-filters/PointFilter";
import { PropertyFilter } from "../ast/filters/property-filters/PropertyFilter";
import { TimeFilter } from "../ast/filters/property-filters/TimeFilter";
import { TypenameFilter } from "../ast/filters/property-filters/TypenameFilter";
import { CustomCypherSelection } from "../ast/selection/CustomCypherSelection";
import { getConcreteEntities } from "../utils/get-concrete-entities";
import { isConcreteEntity } from "../utils/is-concrete-entity";
import { isInterfaceEntity } from "../utils/is-interface-entity";
import { isRelationshipEntity } from "../utils/is-relationship-entity";
import { isUnionEntity } from "../utils/is-union-entity";
import type { QueryASTFactory } from "./QueryASTFactory";
import {
    parseAggregationWhereFields,
    parseWhereField,
    type AggregationLogicalOperator,
    type AggregationOperator,
} from "./parsers/parse-where-field";

type AggregateWhereInput = {
    count: number | Record<string, any>;
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

    private createConnectionFilter(
        relationship: RelationshipAdapter,
        where: ConnectionWhereArg,

        operator: RelationshipWhereOperator
    ): Filter[] {
        if (
            isInterfaceEntity(relationship.target) &&
            this.isLabelOptimizationForInterfacePossible(where, relationship.target)
        ) {
            const connectionFilter = this.createConnectionFilterTreeNode({
                relationship: relationship,
                target: relationship.target,
                operator,
            });
            const filters = this.createConnectionPredicates({ rel: relationship, entity: relationship.target, where });
            connectionFilter.addFilters(filters);
            return asArray(connectionFilter);
        }

        const filteredEntities = getConcreteEntities(relationship.target, where);
        const connectionFilters: ConnectionFilter[] = [];
        let partialOf: InterfaceEntityAdapter | undefined;
        if (isInterfaceEntity(relationship.target)) {
            partialOf = relationship.target;
        }

        for (const concreteEntity of filteredEntities) {
            const connectionFilter = this.createConnectionFilterTreeNode({
                relationship: relationship,
                target: concreteEntity,
                operator,
            });

            const filters = this.createConnectionPredicates({
                rel: relationship,
                entity: concreteEntity,
                where,
                partialOf,
            });
            connectionFilter.addFilters(filters);
            connectionFilters.push(connectionFilter);
        }
        const logicalOp = this.getLogicalOperatorForRelatedNodeFilters(relationship.target, operator);
        return this.wrapMultipleFiltersInLogical(connectionFilters, logicalOp);
    }

    public createConnectionPredicates({
        rel,
        entity,
        where,
        partialOf,
    }: {
        rel?: RelationshipAdapter;
        entity: EntityAdapter;
        where: GraphQLWhereArg | GraphQLWhereArg[];
        partialOf?: InterfaceEntityAdapter | UnionEntityAdapter;
    }): Filter[] {
        let entityWhere = where;
        if (rel && isUnionEntity(rel.target) && where[entity.name]) {
            entityWhere = where[entity.name];
        }
        const filters = asArray(entityWhere).flatMap((nestedWhere) => {
            return Object.entries(nestedWhere).flatMap(([key, value]: [string, GraphQLWhereArg]) => {
                if (isLogicalOperator(key)) {
                    const nestedFilters = this.createConnectionPredicates({ rel, entity, where: value, partialOf });
                    return [
                        new LogicalFilter({
                            operation: key,
                            filters: filterTruthy(nestedFilters),
                        }),
                    ];
                }

                if (rel && key === "edge") {
                    return this.createEdgeFilters(rel, value ?? {});
                }

                if (key === "node") {
                    if (partialOf && isInterfaceEntity(partialOf) && isConcreteEntity(entity)) {
                        return this.createInterfaceNodeFilters({
                            entity: partialOf,
                            targetEntity: entity,
                            whereFields: value,
                        });
                    } else if (isInterfaceEntity(entity)) {
                        return this.createInterfaceNodeFilters({
                            entity,
                            whereFields: value,
                            relationship: rel,
                        });
                    }
                    return this.createNodeFilters(entity, value);
                }
            });
        });
        return filterTruthy(filters);
    }

    private createCypherFilter({
        attribute,
        comparisonValue,
        operator,
        caseInsensitive,
        attachedTo,
    }: {
        attribute: AttributeAdapter;
        comparisonValue: GraphQLWhereArg;
        operator: FilterOperator | undefined;
        caseInsensitive?: boolean;
        attachedTo?: "node" | "relationship";
    }): Filter | Filter[] {
        const selection = new CustomCypherSelection({
            operationField: attribute,
            rawArguments: {},
            isNested: true,
            attachedTo,
        });

        if (attribute.annotations.cypher?.targetEntity) {
            const entityAdapter = getEntityAdapter(attribute.annotations.cypher.targetEntity);

            if (operator && !isLegacyRelationshipOperator(operator)) {
                throw new Error(`Invalid operator ${operator} for relationship`);
            }
            // path for generic filters input, in v8 it will be the only path
            if (!operator && attribute.typeHelper.isList()) {
                const genericFilters = Object.entries(comparisonValue).flatMap(([quantifier, predicate]) => {
                    const legacyOperator = this.convertRelationshipOperatorToLegacyOperator(quantifier);
                    return this.createCypherRelationshipFilter({
                        where: predicate,
                        selection,
                        target: entityAdapter,
                        operator: legacyOperator,
                        attribute,
                    });
                });
                return this.wrapMultipleFiltersInLogical(genericFilters);
            }

            return this.createCypherRelationshipFilter({
                where: comparisonValue,
                selection,
                target: entityAdapter,
                operator: operator ?? "SOME",
                attribute,
            });
        }

        const comparisonValueParam = new Cypher.Param(comparisonValue);

        return new CypherFilter({
            selection,
            attribute,
            comparisonValue: comparisonValueParam,
            operator: operator ?? "EQ",
            caseInsensitive,
        });
    }

    protected createPropertyFilter({
        attribute,
        relationship,
        comparisonValue,
        operator,
        attachedTo,
        caseInsensitive,
    }: {
        attribute: AttributeAdapter;
        relationship?: RelationshipAdapter;
        comparisonValue: GraphQLWhereArg;
        operator: FilterOperator | undefined;
        attachedTo?: "node" | "relationship";
        caseInsensitive?: boolean;
    }): Filter | Filter[] {
        if (attribute.annotations.cypher) {
            return this.createCypherFilter({
                attribute,
                comparisonValue,
                operator,
                caseInsensitive,
                attachedTo,
            });
        }
        // Implicit _EQ filters are removed but the argument "operator" can still be undefined in some cases, for instance:
        // Cypher 1:1 relationship filters as they are stored as Attribute.
        // Federation Subgraph resolver, _entities field implementation is using the FilterFactory {  "__typename": "Product",  "upc": "abc123"}.
        operator = operator ?? "EQ";
        if (attribute.typeHelper.isDuration()) {
            return new DurationFilter({
                attribute,
                comparisonValue,
                operator,
                attachedTo,
            });
        }
        if (attribute.typeHelper.isPoint() || attribute.typeHelper.isCartesianPoint()) {
            return new PointFilter({
                attribute,
                comparisonValue,
                operator,
                attachedTo,
            });
        }
        if (attribute.typeHelper.isDateTime()) {
            return new DateTimeFilter({
                attribute,
                comparisonValue,
                operator,
                attachedTo,
            });
        }
        if (attribute.typeHelper.isTime()) {
            return new TimeFilter({
                attribute,
                comparisonValue,
                operator,
                attachedTo,
            });
        }

        return new PropertyFilter({
            attribute,
            relationship,
            comparisonValue,
            operator,
            attachedTo,
            caseInsensitive,
        });
    }

    private createRelationshipFilter(
        relationship: RelationshipAdapter,
        where: GraphQLWhereArg,
        operator: RelationshipWhereOperator | undefined
    ): Filter[] {
        /**
         * The logic below can be confusing, but it's to handle the following cases:
         * 1. where: { actors: null } -> in this case we want to return an Exists filter as showed by tests packages/graphql/tests/tck/null.test.ts
         * 2. where: {} -> in this case we want to not apply any filter, as showed by tests packages/graphql/tests/tck/issues/402.test.ts
         **/
        const isNull = where === null;
        if (!isNull && Object.keys(where).length === 0) {
            return [];
        }

        const filteredEntities = getConcreteEntities(relationship.target, where);
        const relationshipFilters: RelationshipFilter[] = [];
        for (const concreteEntity of filteredEntities) {
            const relationshipFilter = this.createRelationshipFilterTreeNode({
                relationship,
                target: concreteEntity,
                operator: operator ?? "SOME",
            });

            if (!isNull) {
                const entityWhere = where[concreteEntity.name] ?? where;
                const targetNodeFilters = this.createNodeFilters(concreteEntity, entityWhere);
                relationshipFilter.addTargetNodeFilter(...targetNodeFilters);
            }

            relationshipFilters.push(relationshipFilter);
        }
        const logicalOp = this.getLogicalOperatorForRelatedNodeFilters(relationship.target, operator);
        return this.wrapMultipleFiltersInLogical(relationshipFilters, logicalOp);
    }

    protected createCypherRelationshipFilter({
        selection,
        target,
        where,
        attribute,
        operator,
    }: {
        selection: CustomCypherSelection;
        target: EntityAdapter;
        where: GraphQLWhereArg;
        operator: RelationshipWhereOperator | undefined;
        attribute: AttributeAdapter;
    }): Filter[] {
        /**
         * The logic below can be confusing, but it's to handle the following cases:
         * 1. where: { actors: null } -> in this case we want to return an Exists filter as showed by tests packages/graphql/tests/tck/null.test.ts
         * 2. where: {} -> in this case we want to not apply any filter, as showed by tests packages/graphql/tests/tck/issues/402.test.ts
         **/
        const isNull = where === null;
        if (!isNull && Object.keys(where).length === 0) {
            return [];
        }
        // TODO the below logic is unnecessary, Cypher relationship are not supported for Composite Entities
        const filteredEntities = getConcreteEntities(target, where);
        const filters: (CypherOneToOneRelationshipFilter | CypherRelationshipFilter)[] = [];
        for (const concreteEntity of filteredEntities) {
            const returnVariable = new Cypher.Node();

            const options = {
                selection,
                isNull,
                operator: operator ?? "SOME",
                attribute,
                returnVariable,
            };

            const filter = attribute.typeHelper.isList()
                ? this.createCypherRelationshipFilterTreeNode(options)
                : this.createCypherOneToOneRelationshipFilterTreeNode(options);

            if (!isNull) {
                const entityWhere = where[concreteEntity.name] ?? where;
                const targetNodeFilters = this.createNodeFilters(concreteEntity, entityWhere);
                filter.addTargetNodeFilter(...targetNodeFilters);
            }

            filters.push(filter);
        }
        const logicalOp = this.getLogicalOperatorForRelatedNodeFilters(target, operator);
        return this.wrapMultipleFiltersInLogical(filters, logicalOp);
    }

    // This allows to override this creation in AuthFilterFactory
    protected createCypherOneToOneRelationshipFilterTreeNode(options: {
        selection: CustomCypherSelection;
        attribute: AttributeAdapter;
        isNull: boolean;
        operator: RelationshipWhereOperator;
        returnVariable: Cypher.Node;
    }): CypherOneToOneRelationshipFilter {
        return new CypherOneToOneRelationshipFilter(options);
    }

    // This allows to override this creation in AuthFilterFactory
    protected createCypherRelationshipFilterTreeNode(options: {
        selection: CustomCypherSelection;
        attribute: AttributeAdapter;
        isNull: boolean;
        operator: RelationshipWhereOperator;
        returnVariable: Cypher.Node;
    }): CypherRelationshipFilter {
        return new CypherRelationshipFilter(options);
    }

    // This allows to override this creation in AuthFilterFactory
    protected createRelationshipFilterTreeNode(options: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter | InterfaceEntityAdapter;
        operator: RelationshipWhereOperator;
    }): RelationshipFilter {
        return new RelationshipFilter(options);
    }

    // This allows to override this creation in AuthFilterFactory
    protected createConnectionFilterTreeNode(options: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter | InterfaceEntityAdapter;
        operator: RelationshipWhereOperator;
    }): ConnectionFilter {
        return new ConnectionFilter(options);
    }

    public createInterfaceNodeFilters({
        entity,
        targetEntity,
        whereFields,
        relationship,
    }: {
        entity: InterfaceEntityAdapter;
        targetEntity?: ConcreteEntityAdapter;
        whereFields: Record<string, any>;
        relationship?: RelationshipAdapter;
    }): Filter[] {
        const filters = filterTruthy(
            Object.entries(whereFields).flatMap(([key, value]): Filter | Filter[] | undefined => {
                return this.parseEntryFilter({ entity, key, value, targetEntity, relationship });
            })
        );
        return this.wrapMultipleFiltersInLogical(filters);
    }

    public createNodeFilters(
        entity: ConcreteEntityAdapter | UnionEntityAdapter,
        whereFields: Record<string, any>
    ): Filter[] {
        if (isUnionEntity(entity)) {
            return [];
        }
        const filters = filterTruthy(
            Object.entries(whereFields).flatMap(([key, value]): Filter | Filter[] | undefined => {
                return this.parseEntryFilter({ entity, key, value });
            })
        );
        return this.wrapMultipleFiltersInLogical(filters);
    }

    private parseEntryFilter({
        entity,
        key,
        value,
        targetEntity,
        relationship,
    }: {
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter;
        key: string;
        value: any;
        targetEntity?: ConcreteEntityAdapter;
        relationship?: RelationshipAdapter;
    }): Filter | Filter[] {
        const valueAsArray = asArray(value);
        if (key === "edge") {
            return [];
        }
        if (isLogicalOperator(key)) {
            const nestedFilters = valueAsArray.flatMap((nestedWhere) => {
                const nestedOfNestedFilters = Object.entries(nestedWhere).flatMap(([nestedKey, nestedValue]) => {
                    return asArray(
                        this.parseEntryFilter({
                            entity,
                            key: nestedKey,
                            value: nestedValue,
                            targetEntity,
                            relationship,
                        })
                    );
                });

                return this.wrapMultipleFiltersInLogical(nestedOfNestedFilters);
            });
            return new LogicalFilter({
                operation: key,
                filters: nestedFilters,
            });
        }
        if (key === "node") {
            const key = Object.keys(value)[0] as string;
            return this.parseEntryFilter({
                entity,
                key: Object.keys(value)[0] as string,
                value: value[key],
                targetEntity,
                relationship,
            });
        }
        const { fieldName, operator, isConnection, isAggregate } = parseWhereField(key);
        if (isConcreteEntity(entity)) {
            const relationship = entity.findRelationship(fieldName);

            if (relationship) {
                return this.createRelatedNodeFilters({
                    relationship,
                    value,
                    operator,
                    isConnection,
                    isAggregate,
                });
            }
        } else {
            const relationshipDeclaration = entity.findRelationshipDeclarations(fieldName);
            if (targetEntity && relationshipDeclaration) {
                const relationship = relationshipDeclaration.relationshipImplementations.find(
                    (r) => r.source.name === targetEntity.name
                );
                if (!relationship) {
                    throw new Error(`Relationship ${fieldName} not found`);
                }
                return this.createRelatedNodeFilters({
                    relationship,
                    value,
                    operator,
                    isConnection,
                    isAggregate,
                });
            }
            if (key === "typename") {
                const acceptedEntities = entity.concreteEntities.filter((concreteEntity) => {
                    return valueAsArray.some((typenameFilterValue) => typenameFilterValue === concreteEntity.name);
                });
                return new TypenameFilter(acceptedEntities);
            }
        }

        const attribute = entity.findAttribute(fieldName);

        if (!isInterfaceEntity(entity) && !attribute) {
            if (fieldName === "id" && entity.globalIdField) {
                return this.createRelayIdPropertyFilter(entity, operator, value);
            }
        }
        if (!attribute) {
            throw new Error(`Attribute ${fieldName} not found`);
        }

        // This is a bit hacky, basically skipping cypher fields and federation strings being passed to filterFactory
        if (!operator && !attribute.annotations.cypher?.targetEntity && typeof value === "object") {
            return this.parseGenericFilters(targetEntity ?? entity, fieldName, value, relationship);
        }
        return this.createPropertyFilter({
            attribute,
            comparisonValue: value,
            operator: operator,
            relationship,
        });
    }

    private parseGenericFilters(
        entity: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter,
        fieldName: string,
        value: Record<string, any>,
        relationship?: RelationshipAdapter,
        caseInsensitive?: boolean
    ): Filter | Filter[] {
        const genericFilters = Object.entries(value).flatMap((filterInput) => {
            return this.parseGenericFilter(entity, fieldName, filterInput, relationship, caseInsensitive);
        });
        return this.wrapMultipleFiltersInLogical(genericFilters);
    }

    private parseGenericFilter(
        entity: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter,
        fieldName: string,
        filterInput: [string, any],
        relationship?: RelationshipAdapter,
        caseInsensitive?: boolean
    ): Filter | Filter[] {
        const [rawOperator, value] = filterInput;
        if (isLogicalOperator(rawOperator)) {
            const nestedFilters = asArray(value).flatMap((nestedWhere) => {
                return this.parseGenericFilter(entity, fieldName, nestedWhere, relationship, caseInsensitive);
            });
            return new LogicalFilter({
                operation: rawOperator,
                filters: nestedFilters,
            });
        }

        if (rawOperator === "distance") {
            // Converts new distance filter into the old one to be parsed the same as deprecated syntax
            const desugaredInput = this.desugarGenericDistanceOperations(value);
            return this.parseGenericFilters(entity, fieldName, desugaredInput, relationship);
        }

        if (rawOperator === "caseInsensitive") {
            return this.parseGenericFilters(entity, fieldName, value, relationship, true);
        }
        const operator = this.parseGenericOperator(rawOperator);

        const attribute = entity.findAttribute(fieldName);

        if (!attribute) {
            if (isRelationshipEntity(entity) || isInterfaceEntity(entity)) {
                throw new Error("Transpilation error: Expected concrete entity");
            }
            if (fieldName === "id" && entity.globalIdField) {
                return this.createRelayIdPropertyFilter(entity, operator, value);
            }
            throw new Error(`Attribute ${fieldName} not found`);
        }
        const attachedTo = isRelationshipEntity(entity) ? "relationship" : "node";
        const filters = this.createPropertyFilter({
            attribute,
            comparisonValue: value,
            operator,
            attachedTo,
            relationship,
            caseInsensitive,
        });
        return this.wrapMultipleFiltersInLogical(asArray(filters));
    }

    protected parseGenericOperator(key: string): FilterOperator {
        // we convert them to the previous format to keep the same translation logic
        switch (key) {
            case "eq":
                return "EQ";
            case "in":
                return "IN";
            case "lt":
                return "LT";
            case "lte":
                return "LTE";
            case "greaterThan":
            case "gt":
                return "GT";
            case "gte":
                return "GTE";
            case "contains":
                return "CONTAINS";
            case "startsWith":
                return "STARTS_WITH";
            case "endsWith":
                return "ENDS_WITH";
            case "matches":
                return "MATCHES";
            case "includes":
                return "INCLUDES";
            case "distance_eq": // Used for distance -> eq
                return "DISTANCE";
            default:
                throw new Error(`Invalid operator ${key}`);
        }
    }

    private parseGenericOperatorForAggregation(key: string): AggregationLogicalOperator {
        // we convert them to the previous format to keep the same translation logic
        switch (key) {
            case "eq":
                return "EQUAL";
            case "lt":
                return "LT";
            case "lte":
                return "LTE";
            case "gt":
                return "GT";
            case "gte":
                return "GTE";

            default:
                throw new Error(`Invalid operator ${key}`);
        }
    }

    protected convertRelationshipOperatorToLegacyOperator(operator: string): RelationshipWhereOperator {
        switch (operator) {
            case "some":
                return "SOME";
            case "all":
                return "ALL";
            case "single":
                return "SINGLE";
            case "none":
                return "NONE";
        }
        throw new Error(`Invalid operator ${operator}`);
    }

    private createRelatedNodeFilters({
        relationship,
        value,
        operator,
        isConnection,
        isAggregate,
    }: {
        relationship: RelationshipAdapter;
        value: Record<string, any>;
        operator: FilterOperator | undefined;
        isConnection: boolean;
        isAggregate: boolean;
    }): Filter | Filter[] {
        if (isAggregate) {
            return this.createAggregationFilter({
                relationship,
                where: value as AggregateWhereInput,
                isDeprecated: true,
            });
        }
        if (!operator) {
            const genericFilters = Object.entries(value).flatMap(([genericOperator, predicate]) => {
                if (genericOperator === "aggregate") {
                    return this.createAggregationFilter({
                        relationship,
                        where: predicate as AggregateWhereInput,
                        isDeprecated: false,
                    });
                }
                const legacyOperator = this.convertRelationshipOperatorToLegacyOperator(genericOperator);

                return this.createRelatedNodeFilters({
                    relationship,
                    value: predicate,
                    operator: legacyOperator,
                    isConnection,
                    isAggregate,
                });
            });
            return this.wrapMultipleFiltersInLogical(genericFilters);
        }

        if (operator && !isLegacyRelationshipOperator(operator)) {
            throw new Error(`Invalid operator ${operator} for relationship`);
        }
        if (isConnection) {
            return this.createConnectionFilter(relationship, value as ConnectionWhereArg, operator);
        }
        return this.createRelationshipFilter(relationship, value as GraphQLWhereArg, operator);
    }

    private getLogicalOperatorForRelatedNodeFilters(
        target: EntityAdapter,
        operator: "SOME" | "ALL" | "SINGLE" | "NONE" = "SOME"
    ): "AND" | "OR" | "XOR" {
        if (isInterfaceEntity(target) || isUnionEntity(target)) {
            if (operator === "SOME") {
                return "OR";
            }
            if (operator === "SINGLE") {
                return "XOR";
            }
        }
        return "AND";
    }

    private createRelayIdPropertyFilter(
        entity: ConcreteEntityAdapter,

        operator: FilterOperator | undefined = "EQ",
        value: string
    ): Filter | Filter[] {
        const relayIdData = fromGlobalId(value);
        const { typeName, field } = relayIdData;
        let id = relayIdData.id;

        if (typeName !== entity.name || !field || !id) {
            throw new Error(`Cannot query Relay Id on "${entity.name}"`);
        }
        const idAttribute = entity.findAttribute(field);
        if (!idAttribute) {
            throw new Error(`Attribute ${field} not found`);
        }

        if (idAttribute.typeHelper.isNumeric()) {
            id = Number(id);
            if (Number.isNaN(id)) {
                throw new Error("Can't parse non-numeric relay id");
            }
        }

        return this.createPropertyFilter({
            attribute: idAttribute,
            comparisonValue: id as unknown as GraphQLWhereArg,
            operator,
        });
    }

    public createEdgeFilters(relationship: RelationshipAdapter, where: GraphQLWhereArg): Filter[] {
        const filterASTs = Object.entries(where).flatMap(([key, value]): Filter | Filter[] | undefined => {
            if (key === "node") {
                return [];
            }
            if (isLogicalOperator(key)) {
                const nestedFilters = asArray(value).flatMap((nestedWhere) => {
                    return this.createEdgeFilters(relationship, nestedWhere);
                });
                return new LogicalFilter({
                    operation: key,
                    filters: nestedFilters,
                });
            }
            if (key === "edge") {
                return this.createEdgeFilters(relationship, value);
            }
            const { fieldName, operator } = parseWhereField(key);

            const attribute = relationship.findAttribute(fieldName);
            if (!attribute) {
                // @declareRelationship path.
                if (fieldName === relationship.propertiesTypeName) {
                    return this.createEdgeFilters(relationship, value);
                }
                return;
            }
            if (!operator) {
                return this.parseGenericFilters(relationship, fieldName, value);
            }

            return this.createPropertyFilter({
                attribute,
                comparisonValue: value,
                operator,
                attachedTo: "relationship",
            });
        });

        return this.wrapMultipleFiltersInLogical(filterTruthy(filterASTs));
    }

    private createCountFilter({
        operatorKey,
        value,
        attachedTo,
        useDeprecated = true,
        relationship,
    }: {
        operatorKey: string;
        value: unknown;
        attachedTo: "node" | "relationship";
        useDeprecated?: boolean;
        relationship: RelationshipAdapter;
    }): CountFilter {
        const operator = this.parseGenericOperator(operatorKey) as AggregationLogicalOperator;
        return new CountFilter({
            operator: operator,
            comparisonValue: value,
            attachedTo,
            relationship,
            isDeprecated: useDeprecated,
        });
    }

    private parseConnectionAggregationCountFilter({
        countInput,
        attachedTo,
        relationship,
    }: {
        countInput: Record<string, any>;
        attachedTo: "node" | "relationship";
        relationship: RelationshipAdapter;
    }): CountFilter[] {
        return Object.entries(countInput).map(([key, value]) => {
            const operator = this.parseGenericOperator(key) as AggregationLogicalOperator;
            return new CountFilter({
                operator: operator,
                comparisonValue: value,
                attachedTo,
                relationship,
                isDeprecated: false,
            });
        });
    }

    private getAggregationNestedFilters({
        where,
        relationship,
        isDeprecated,
    }: {
        where: AggregateWhereInput;
        relationship: RelationshipAdapter;
        isDeprecated: boolean;
    }): Array<AggregationPropertyFilter | CountFilter | LogicalFilter> {
        const nestedFilters = Object.entries(where).flatMap(
            ([key, value]): Array<AggregationPropertyFilter | CountFilter | LogicalFilter> => {
                if (isLogicalOperator(key)) {
                    const nestedFilters = asArray(value).flatMap((nestedWhere) => {
                        return this.getAggregationNestedFilters({
                            where: nestedWhere,
                            relationship,
                            isDeprecated,
                        });
                    });

                    const logicalFilter = new LogicalFilter({
                        operation: key,
                        filters: nestedFilters,
                    });
                    return [logicalFilter];
                }
                const { fieldName, logicalOperator: operator } = parseAggregationWhereFields(key);

                if (fieldName === "count") {
                    if (!operator) {
                        if (!isDeprecated) {
                            return Object.entries(value).flatMap(([key, value]) => {
                                if (key === "nodes") {
                                    return this.parseConnectionAggregationCountFilter({
                                        countInput: value,
                                        attachedTo: "node",
                                        relationship,
                                    });
                                }
                                return this.parseConnectionAggregationCountFilter({
                                    countInput: value,
                                    attachedTo: "relationship",
                                    relationship,
                                });
                            });
                        }
                        return Object.entries(value).map(([key, value]) => {
                            const operator = this.parseGenericOperator(key) as AggregationLogicalOperator;
                            return new CountFilter({
                                operator: operator,
                                comparisonValue: value,
                                attachedTo: "node",
                                relationship,
                                isDeprecated,
                            });
                        });
                    }

                    const countFilter = new CountFilter({
                        operator: operator ?? "EQ",
                        comparisonValue: value,
                        relationship,
                        isDeprecated,
                    });
                    return [countFilter];
                }

                if (fieldName === "node") {
                    return this.createAggregationNodeFilters({
                        where: value as Record<string, any>,
                        relationship,
                        attachedTo: "node",
                        isDeprecated,
                    });
                }

                if (fieldName === "edge" && relationship.propertiesTypeName) {
                    // This conditional handles when the relationship is an interface which is also being accessed through an interface
                    if (
                        isInterfaceEntity(relationship.target) &&
                        Object.keys(value).some((v) => relationship.siblings?.includes(v))
                    ) {
                        return Object.entries(value).flatMap(([k, v]) => {
                            if (k === relationship.propertiesTypeName) {
                                return this.createAggregationNodeFilters({
                                    where: v as Record<string, any>,
                                    relationship,
                                    attachedTo: "relationship",
                                    isDeprecated,
                                });
                            }
                            return [];
                        });
                    }
                    return this.createAggregationNodeFilters({
                        where: value as Record<string, any>,
                        relationship,
                        attachedTo: "relationship",
                        isDeprecated,
                    });
                }

                throw new Error(`Aggregation filter not found ${key}`);
            }
        );

        return this.wrapMultipleFiltersInLogical(nestedFilters);
    }

    private createAggregationFilter({
        relationship,
        where,
        isDeprecated,
    }: {
        relationship: RelationshipAdapter;
        where: AggregateWhereInput;
        isDeprecated: boolean;
    }): Filter | Filter[] {
        return this.wrapMultipleFiltersInLogical(
            this.getAggregationNestedFilters({ where, relationship, isDeprecated })
        );
    }

    private createAggregationNodeFilters({
        where,
        relationship,
        attachedTo,
        isDeprecated,
    }: {
        where: Record<string, any>;
        relationship: RelationshipAdapter;
        attachedTo: "node" | "relationship";
        isDeprecated: boolean;
    }): Array<AggregationPropertyFilter | LogicalFilter> {
        const filters = Object.entries(where).flatMap(([key, value]) => {
            if (isLogicalOperator(key)) {
                const filters = asArray(value).flatMap((nestedWhere) => {
                    return this.createAggregationNodeFilters({
                        where: nestedWhere,
                        relationship,
                        attachedTo,
                        isDeprecated,
                    });
                });
                return new LogicalFilter({
                    operation: key,
                    filters,
                });
            }
            const entity = (attachedTo === "node" ? relationship.target : relationship) as
                | RelationshipAdapter
                | ConcreteEntityAdapter
                | InterfaceEntityAdapter; // Union are not supported in aggregations.

            // NOTE: if aggregationOperator is undefined, maybe we could return a normal PropertyFilter instead
            const { fieldName, logicalOperator, aggregationOperator } = parseAggregationWhereFields(key);

            const attr = entity.findAttribute(fieldName);
            if (!attr) {
                throw new Error(`Attribute ${fieldName} not found`);
            }

            if (!aggregationOperator) {
                const filters = Object.entries(value).flatMap(([aggregationOperator, value]) => {
                    const parsedAggregationOperation = this.parseGenericAggregationOperator(aggregationOperator);

                    // NOTE: this part is duplicate of the code used for non-generic operators
                    return Object.entries(value as Record<string, unknown>).map(([operator, value]) => {
                        const parsedOperator = this.parseGenericOperatorForAggregation(operator);
                        if (attr.typeHelper.isDuration()) {
                            return new AggregationDurationFilter({
                                attribute: attr,
                                relationship: relationship,
                                comparisonValue: value,
                                logicalOperator: parsedOperator || "EQUAL",
                                aggregationOperator: parsedAggregationOperation,
                                attachedTo,
                                isDeprecated,
                            });
                        }

                        if (attr.typeHelper.isDateTime()) {
                            return new AggregationDateTimeFilter({
                                attribute: attr,
                                relationship: relationship,
                                comparisonValue: value,
                                logicalOperator: parsedOperator || "EQUAL",
                                aggregationOperator: parsedAggregationOperation,
                                attachedTo,
                                isDeprecated,
                            });
                        }

                        if (attr.typeHelper.isTime()) {
                            return new AggregationTimeFilter({
                                attribute: attr,
                                relationship: relationship,
                                comparisonValue: value,
                                logicalOperator: parsedOperator || "EQUAL",
                                aggregationOperator: parsedAggregationOperation,
                                attachedTo,
                                isDeprecated,
                            });
                        }

                        return new AggregationPropertyFilter({
                            attribute: attr,
                            relationship: relationship,
                            comparisonValue: value,
                            logicalOperator: parsedOperator || "EQUAL",
                            aggregationOperator: parsedAggregationOperation,
                            attachedTo,
                            isDeprecated,
                        });
                    });
                });
                return this.wrapMultipleFiltersInLogical(filters);
            }

            if (attr.typeHelper.isDuration()) {
                return new AggregationDurationFilter({
                    attribute: attr,
                    relationship: relationship,
                    comparisonValue: value,
                    logicalOperator: logicalOperator || "EQUAL",
                    aggregationOperator: aggregationOperator,
                    attachedTo,
                    isDeprecated,
                });
            }

            if (attr.typeHelper.isDateTime()) {
                return new AggregationDateTimeFilter({
                    attribute: attr,
                    relationship: relationship,
                    comparisonValue: value,
                    logicalOperator: logicalOperator || "EQUAL",
                    aggregationOperator: aggregationOperator,
                    attachedTo,
                    isDeprecated,
                });
            }

            if (attr.typeHelper.isTime()) {
                return new AggregationTimeFilter({
                    attribute: attr,
                    relationship: relationship,
                    comparisonValue: value,
                    logicalOperator: logicalOperator || "EQUAL",
                    aggregationOperator: aggregationOperator,
                    attachedTo,
                    isDeprecated,
                });
            }

            return new AggregationPropertyFilter({
                attribute: attr,
                relationship: relationship,
                comparisonValue: value,
                logicalOperator: logicalOperator || "EQUAL",
                aggregationOperator: aggregationOperator,
                attachedTo,
                isDeprecated,
            });
        });

        return this.wrapMultipleFiltersInLogical(filters);
    }

    /** Returns an array of 0 or 1 elements with the filters wrapped using a logical operator if needed */
    protected wrapMultipleFiltersInLogical<F extends Filter>(
        filters: F[],
        logicalOp: "AND" | "OR" | "XOR" = "AND"
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

    // This method identifies if it's possible to achieve MATCH (n)-[r]->(m) WHERE m:Movie Or m:Series rather than MATCH (n)-[r]->(m:Movie) Or MATCH (n)-[r]->(m:Series)
    // When filters contain a nested relationship filter this is no longer achievable as the relationship definition is not shared between each concrete entity.
    // For context check TCK test packages/graphql/tests/tck/issues/2709.test.ts --> "should not use a node label so it covers all nodes implementing the interface for connection rel".
    private isLabelOptimizationForInterfacePossible(
        where: ConnectionWhereArg,
        entity: InterfaceEntityAdapter
    ): boolean {
        if (where.node) {
            const containsUnOptimizableFields = Object.keys(where.node).some((field) => {
                const { fieldName, isAggregate, isConnection } = parseWhereField(field);
                if (isAggregate || isConnection) {
                    return true;
                }
                const relationshipDeclaration = entity.findRelationshipDeclarations(fieldName);
                if (relationshipDeclaration) {
                    return true;
                }
                return false;
            });
            return !containsUnOptimizableFields;
        }
        return true;
    }

    /** Converts new distance operator into traditional operator **/
    private desugarGenericDistanceOperations(distance: Record<string, any> & { from: any }): Record<string, any> {
        const point = distance.from;
        const targetPoint: Record<string, any> = {};

        // eslint-disable-next-line prefer-const
        for (let [key, value] of Object.entries(distance)) {
            if (key !== "from") {
                // We need this fake operator to differentiate distance from point eq in the
                // desugaring process. Not needed in other operators because they are always distance based
                if (key === "eq") {
                    key = "distance_eq";
                }
                targetPoint[key] = {
                    distance: value,
                    point,
                };
            }
        }
        return targetPoint;
    }

    private parseGenericAggregationOperator(key: string): AggregationOperator {
        // we convert them to the previous format to keep the same translation logic
        switch (key) {
            case "averageLength":
            case "average":
                return "AVERAGE";
            case "shortestLength":
            case "shortest":
                return "SHORTEST";
            case "longestLength":
            case "longest":
                return "LONGEST";
            case "min":
                return "MIN";
            case "max":
                return "MAX";
            case "sum":
                return "SUM";
            default:
                throw new Error(`Invalid aggregation operator ${key}`);
        }
    }
}
