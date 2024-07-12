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

import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { Attribute } from "../../schema-model/attribute/Attribute";
import { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Relationship } from "../../schema-model/relationship/Relationship";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { ConnectionFilter } from "../../translate/queryAST/ast/filters/ConnectionFilter";
import type { Filter, LogicalOperators } from "../../translate/queryAST/ast/filters/Filter";
import { LogicalFilter } from "../../translate/queryAST/ast/filters/LogicalFilter";
import { DurationFilter } from "../../translate/queryAST/ast/filters/property-filters/DurationFilter";
import { PropertyFilter } from "../../translate/queryAST/ast/filters/property-filters/PropertyFilter";
import { SpatialFilter } from "../../translate/queryAST/ast/filters/property-filters/SpatialFilter";
import { fromGlobalId } from "../../utils/global-ids";
import { getFilterOperator, getRelationshipOperator } from "./FilterOperators";
import type {
    GraphQLAttributeFilters,
    GraphQLEdgeWhere,
    GraphQLNodeFilters,
    GraphQLNodeWhere,
    GraphQLWhere,
    GraphQLWhereTopLevel,
    RelationshipFilters,
} from "./resolve-tree-parser/graphql-tree/where";

export class FilterFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
    }

    public createFilters({
        where = {},
        relationship,
        entity,
    }: {
        entity: ConcreteEntity;
        relationship?: Relationship;
        where?: GraphQLWhere;
    }): Filter[] {
        const andFilters = this.createLogicalFilters({ operation: "AND", entity, relationship, where: where.AND });
        const orFilters = this.createLogicalFilters({ operation: "OR", entity, relationship, where: where.OR });
        const notFilters = this.createLogicalFilters({
            operation: "NOT",
            entity,
            relationship,
            where: where.NOT ? [where.NOT] : undefined,
        });

        const edgeFilters = this.createEdgeFilters({ entity, relationship, edgeWhere: where.edges });

        return [...this.mergeFiltersWithAnd(edgeFilters), ...andFilters, ...orFilters, ...notFilters];
    }

    public createTopLevelFilters({
        where = {},
        entity,
    }: {
        entity: ConcreteEntity;
        where?: GraphQLWhereTopLevel;
    }): Filter[] {
        const andFilters = this.createTopLevelLogicalFilters({ operation: "AND", entity, where: where.AND });
        const orFilters = this.createTopLevelLogicalFilters({ operation: "OR", entity, where: where.OR });
        const notFilters = this.createTopLevelLogicalFilters({
            operation: "NOT",
            entity,
            where: where.NOT ? [where.NOT] : undefined,
        });

        const edgeFilters = this.createNodeFilter({ entity, where: where.node });
        return [...edgeFilters, ...andFilters, ...orFilters, ...notFilters];
    }

    private createTopLevelLogicalFilters({
        where = [],
        operation,
        entity,
    }: {
        entity: ConcreteEntity;
        operation: LogicalOperators;
        where?: GraphQLWhereTopLevel[];
    }): [] | [Filter] {
        if (where.length === 0) {
            return [];
        }
        const nestedFilters = where.flatMap((orWhere: GraphQLWhereTopLevel) => {
            return this.createTopLevelFilters({ entity, where: orWhere });
        });

        if (nestedFilters.length > 0) {
            return [
                new LogicalFilter({
                    operation,
                    filters: nestedFilters,
                }),
            ];
        }

        return [];
    }

    private createLogicalFilters({
        where = [],
        relationship,
        operation,
        entity,
    }: {
        entity: ConcreteEntity;
        relationship?: Relationship;
        operation: LogicalOperators;
        where?: GraphQLEdgeWhere[];
    }): [] | [Filter] {
        if (where.length === 0) {
            return [];
        }
        const nestedFilters = where.flatMap((orWhere: GraphQLEdgeWhere) => {
            return this.createFilters({ entity, relationship, where: orWhere });
        });

        if (nestedFilters.length > 0) {
            return [
                new LogicalFilter({
                    operation,
                    filters: nestedFilters,
                }),
            ];
        }

        return [];
    }

    private createEdgeFilters({
        edgeWhere = {},
        relationship,
        entity,
    }: {
        entity: ConcreteEntity;
        relationship?: Relationship;
        edgeWhere?: GraphQLEdgeWhere;
    }): Filter[] {
        const andFilters = this.createLogicalEdgeFilters(entity, relationship, "AND", edgeWhere.AND);
        const orFilters = this.createLogicalEdgeFilters(entity, relationship, "OR", edgeWhere.OR);
        const notFilters = this.createLogicalEdgeFilters(
            entity,
            relationship,
            "NOT",
            edgeWhere.NOT ? [edgeWhere.NOT] : undefined
        );

        const nodeFilters = this.createNodeFilter({ where: edgeWhere.node, entity });

        let edgePropertiesFilters: Filter[] = [];
        if (relationship) {
            edgePropertiesFilters = this.createEdgePropertiesFilters({
                where: edgeWhere.properties,
                relationship,
            });
        }
        return [
            ...this.mergeFiltersWithAnd(nodeFilters),
            ...edgePropertiesFilters,
            ...andFilters,
            ...orFilters,
            ...notFilters,
        ];
    }

    private createLogicalEdgeFilters(
        entity: ConcreteEntity,
        relationship: Relationship | undefined,
        operation: LogicalOperators,
        where: GraphQLEdgeWhere[] = []
    ): [] | [Filter] {
        if (where.length === 0) {
            return [];
        }
        const nestedFilters = where.flatMap((logicalWhere: GraphQLEdgeWhere) => {
            return this.createEdgeFilters({ entity, relationship, edgeWhere: logicalWhere });
        });

        if (nestedFilters.length > 0) {
            return [
                new LogicalFilter({
                    operation,
                    filters: nestedFilters,
                }),
            ];
        }

        return [];
    }

    private createNodeFilter({ where = {}, entity }: { entity: ConcreteEntity; where?: GraphQLNodeWhere }): Filter[] {
        const andFilters = this.createLogicalNodeFilters(entity, "AND", where.AND);
        const orFilters = this.createLogicalNodeFilters(entity, "OR", where.OR);
        const notFilters = this.createLogicalNodeFilters(entity, "NOT", where.NOT ? [where.NOT] : undefined);

        const nodePropertiesFilters = Object.entries(where).flatMap(([fieldName, filtersWithLogical]) => {
            if (["AND", "OR", "NOT"].includes(fieldName)) {
                return [];
            }

            let filters = filtersWithLogical as GraphQLNodeFilters;

            let attribute: Attribute | undefined;
            if (fieldName === "id" && entity.globalIdField) {
                attribute = entity.globalIdField;
                filters = this.parseGlobalIdFilters(entity, filters);
            } else {
                attribute = entity.findAttribute(fieldName);
            }

            if (attribute) {
                const attributeAdapter = new AttributeAdapter(attribute);
                // We need to cast for now because filters can be plain attribute or relationships, but the check is done by checking the findAttribute
                // TODO: Use a helper method that handles this casting with `is GraphQLAttributeFilters`
                return this.createPropertyFilters(attributeAdapter, filters as GraphQLAttributeFilters);
            }

            const relationship = entity.findRelationship(fieldName);
            if (relationship) {
                return this.createRelationshipFilters(relationship, filters as RelationshipFilters);
            }
            return [];
        });

        return [...andFilters, ...orFilters, ...notFilters, ...this.mergeFiltersWithAnd(nodePropertiesFilters)];
    }

    private createLogicalNodeFilters(
        entity: ConcreteEntity,
        operation: LogicalOperators,
        where: GraphQLNodeWhere[] = []
    ): [] | [Filter] {
        if (where.length === 0) {
            return [];
        }
        const nestedFilters = where.flatMap((logicalWhere) => {
            return this.createNodeFilter({ entity, where: logicalWhere });
        });

        if (nestedFilters.length > 0) {
            return [
                new LogicalFilter({
                    operation,
                    filters: nestedFilters,
                }),
            ];
        }

        return [];
    }

    /** Transforms globalId filters into normal property filters */
    private parseGlobalIdFilters(entity: ConcreteEntity, filters: GraphQLNodeFilters): GraphQLNodeFilters {
        return Object.entries(filters).reduce((acc, [key, value]) => {
            const relayIdData = fromGlobalId(value);
            const { typeName, field, id } = relayIdData;

            if (typeName !== entity.name || !field || !id) {
                throw new Error(`Cannot query Relay Id on "${entity.name}"`);
            }
            acc[key] = id;
            return acc;
        }, {});
    }

    private createRelationshipFilters(relationship: Relationship, filters: RelationshipFilters): Filter[] {
        const relationshipAdapter = new RelationshipAdapter(relationship);

        const target = relationshipAdapter.target as ConcreteEntityAdapter;
        const edgeFilters = filters.edges ?? {};

        return Object.entries(edgeFilters).map(([rawOperator, filter]) => {
            const relatedNodeFilters = this.createEdgeFilters({
                edgeWhere: filter,
                relationship: relationship,
                entity: relationship.target as ConcreteEntity,
            });
            const operator = getRelationshipOperator(rawOperator);
            const relationshipFilter = new ConnectionFilter({
                relationship: relationshipAdapter,
                target,
                operator,
            });
            relationshipFilter.addFilters(relatedNodeFilters);
            return relationshipFilter;
        });
    }

    private createEdgePropertiesFilters({
        where,
        relationship,
    }: {
        where: GraphQLEdgeWhere["properties"];
        relationship: Relationship;
    }): Filter[] {
        if (!where) {
            return [];
        }
        return Object.entries(where).flatMap(([fieldName, filters]) => {
            // TODO: Logical filters here
            const attribute = relationship.findAttribute(fieldName);
            if (!attribute) return [];
            const attributeAdapter = new AttributeAdapter(attribute);
            return this.createPropertyFilters(attributeAdapter, filters, "relationship");
        });
    }

    // TODO: remove adapter from here
    private createPropertyFilters(
        attribute: AttributeAdapter,
        filters: GraphQLAttributeFilters | null,
        attachedTo: "node" | "relationship" = "node"
    ): Filter[] {
        if (!filters) {
            return [];
        }
        return Object.entries(filters).map(([key, value]) => {
            if (key === "AND" || key === "OR" || key === "NOT") {
                return new LogicalFilter({
                    operation: key as LogicalOperators,
                    filters: this.createPropertyFilters(attribute, value),
                });
            }
            const operator = getFilterOperator(attribute, key);
            if (!operator) {
                throw new Error(`Invalid operator: ${key}`);
            }
            if (attribute.typeHelper.isDuration()) {
                return new DurationFilter({
                    attribute,
                    comparisonValue: value,
                    operator,
                    attachedTo,
                });
            }
            if (attribute.typeHelper.isSpatial()) {
                return new SpatialFilter({
                    attribute,
                    relationship: undefined,
                    comparisonValue: value,
                    operator,
                    attachedTo,
                });
            }
            return new PropertyFilter({
                attribute,
                relationship: undefined,
                comparisonValue: value,
                operator,
                attachedTo,
            });
        });
    }

    private mergeFiltersWithAnd(filters: Filter[]): Filter[] {
        if (filters.length > 1) {
            return [
                new LogicalFilter({
                    operation: "AND",
                    filters: filters,
                }),
            ];
        }
        return filters;
    }
}
