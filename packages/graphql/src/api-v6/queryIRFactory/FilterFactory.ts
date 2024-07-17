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
import { asArray, filterTruthy } from "../../utils/utils";
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
        where?: GraphQLWhere | GraphQLWhereTopLevel | GraphQLEdgeWhere;
    }): Filter | undefined {
        const filters = filterTruthy(
            Object.entries(where).map(([key, value]) => {
                if (key === "AND" || key === "OR" || key === "NOT") {
                    const whereInLogicalOperation = asArray(value) as Array<
                        GraphQLWhere | GraphQLWhereTopLevel | GraphQLEdgeWhere
                    >;
                    const nestedFilters = whereInLogicalOperation.map((nestedWhere) => {
                        return this.createFilters({
                            where: nestedWhere,
                            relationship,
                            entity,
                        });
                    });

                    return new LogicalFilter({
                        operation: key,
                        filters: filterTruthy(nestedFilters),
                    });
                }

                if (key === "edges") {
                    return this.createFilters({ entity, relationship, where: value });
                }

                if (key === "node") {
                    return this.createNodeFilter({ entity, where: value });
                }

                if (key === "properties" && relationship) {
                    return this.createEdgePropertiesFilters({
                        where: value,
                        relationship,
                    });
                }
            })
        );

        return this.mergeFilters(filters);
    }

    private createNodeFilter({
        where = {},
        entity,
    }: {
        entity: ConcreteEntity;
        where?: GraphQLNodeWhere;
    }): Filter | undefined {
        const nodePropertiesFilters = Object.entries(where).flatMap(([fieldName, nestedWhere]) => {
            if (fieldName === "AND" || fieldName === "OR" || fieldName === "NOT") {
                const whereInLogicalOperator = asArray(nestedWhere) as Array<GraphQLNodeWhere>;
                const nestedFilters = whereInLogicalOperator.map((nestedWhere) => {
                    return this.createNodeFilter({
                        where: nestedWhere,
                        entity,
                    });
                });

                return new LogicalFilter({
                    operation: fieldName,
                    filters: filterTruthy(nestedFilters),
                });
            }

            let filters = nestedWhere as GraphQLNodeFilters;

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

        return new LogicalFilter({
            operation: "AND",
            filters: filterTruthy(nodePropertiesFilters),
        });
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
            const relatedNodeFilters = this.createFilters({
                where: filter,
                relationship: relationship,
                entity: relationship.target as ConcreteEntity,
            });
            const operator = getRelationshipOperator(rawOperator);
            const relationshipFilter = new ConnectionFilter({
                relationship: relationshipAdapter,
                target,
                operator,
            });
            if (relatedNodeFilters) {
                relationshipFilter.addFilters([relatedNodeFilters]);
            }
            return relationshipFilter;
        });
    }

    private createEdgePropertiesFilters({
        where = {},
        relationship,
    }: {
        where: GraphQLEdgeWhere["properties"];
        relationship: Relationship;
    }): Filter | undefined {
        const filters = Object.entries(where).flatMap(([fieldName, filters]) => {
            if (fieldName === "AND" || fieldName === "OR" || fieldName === "NOT") {
                const whereInLogicalOperator = asArray(filters) as Array<GraphQLEdgeWhere["properties"]>;
                const nestedFilters = whereInLogicalOperator.map((nestedWhere) => {
                    return this.createEdgePropertiesFilters({
                        where: nestedWhere,
                        relationship,
                    });
                });

                return new LogicalFilter({
                    operation: fieldName,
                    filters: filterTruthy(nestedFilters),
                });
            }

            const attribute = relationship.findAttribute(fieldName);
            if (!attribute) return [];
            const attributeAdapter = new AttributeAdapter(attribute);
            return this.createPropertyFilters(attributeAdapter, filters, "relationship");
        });

        return this.mergeFilters(filters);
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

    private mergeFilters(filters: Filter[]): Filter | undefined {
        if (filters.length == 0) {
            return undefined;
        }
        if (filters.length === 1) {
            return filters[0];
        }

        return new LogicalFilter({
            operation: "AND",
            filters: filters,
        });
    }
}
