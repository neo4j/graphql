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
import { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../schema-model/relationship/Relationship";
import type { Filter, LogicalOperators } from "../../translate/queryAST/ast/filters/Filter";
import { LogicalFilter } from "../../translate/queryAST/ast/filters/LogicalFilter";
import { PropertyFilter } from "../../translate/queryAST/ast/filters/property-filters/PropertyFilter";
import { getFilterOperator } from "./FilterOperators";
import type {
    GraphQLEdgeWhereArgs,
    GraphQLFilters,
    GraphQLWhereArgs,
    StringFilters,
} from "./resolve-tree-parser/graphql-tree";

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
        where?: GraphQLWhereArgs;
    }): Filter[] {
        return this.createEdgeFilters({ entity, relationship, edgeWhere: where.edges });
    }

    private createEdgeFilters({
        edgeWhere = {},
        relationship,
        entity,
    }: {
        entity: ConcreteEntity;
        relationship?: Relationship;
        edgeWhere?: GraphQLEdgeWhereArgs;
    }): Filter[] {
        const andFilters = this.createLogicalEdgeFilters(entity, "AND", edgeWhere.AND);
        const orFilters = this.createLogicalEdgeFilters(entity, "OR", edgeWhere.OR);
        const notFilters = this.createLogicalEdgeFilters(entity, "NOT", edgeWhere.NOT ? [edgeWhere.NOT] : undefined);

        const nodeFilters = this.createNodeFilter({ where: edgeWhere.node, entity });

        let edgePropertiesFilters: Filter[] = [];
        if (relationship) {
            edgePropertiesFilters = this.createEdgePropertiesFilters({
                where: edgeWhere.properties,
                relationship,
            });
        }
        return [...nodeFilters, ...edgePropertiesFilters, ...andFilters, ...orFilters, ...notFilters];
    }

    private createLogicalEdgeFilters(
        entity: ConcreteEntity,
        operation: LogicalOperators,
        where: GraphQLEdgeWhereArgs[] = []
    ): [] | [Filter] {
        if (where.length === 0) {
            return [];
        }
        const nestedFilters = where.flatMap((orWhere: GraphQLEdgeWhereArgs) => {
            return this.createEdgeFilters({ entity, edgeWhere: orWhere });
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

    private createNodeFilter({ where = {}, entity }: { entity: ConcreteEntity; where?: GraphQLFilters }): Filter[] {
        return Object.entries(where).flatMap(([fieldName, filters]) => {
            const attribute = entity.findAttribute(fieldName);
            if (!attribute) return [];
            const attributeAdapter = new AttributeAdapter(attribute);
            return this.createPropertyFilters(attributeAdapter, filters);
        });
    }

    private createEdgePropertiesFilters({
        where,
        relationship,
    }: {
        where: GraphQLEdgeWhereArgs["properties"];
        relationship: Relationship;
    }): Filter[] {
        if (!where) {
            return [];
        }
        return Object.entries(where).flatMap(([fieldName, filters]) => {
            const attribute = relationship.findAttribute(fieldName);
            if (!attribute) return [];
            const attributeAdapter = new AttributeAdapter(attribute);
            return this.createPropertyFilters(attributeAdapter, filters, "relationship");
        });
    }

    private createPropertyFilters(
        attribute: AttributeAdapter,
        filters: StringFilters,
        attachedTo: "node" | "relationship" = "node"
    ): PropertyFilter[] {
        return Object.entries(filters).map(([key, value]) => {
            const operator = getFilterOperator(attribute, key);
            if (!operator) throw new Error("Invalid operator");

            return new PropertyFilter({
                attribute,
                relationship: undefined,
                comparisonValue: value,
                isNot: false, // deprecated
                operator,
                attachedTo,
            });
        });
    }
}
