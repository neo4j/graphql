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

import { PropertyFilter } from "../ast/filters/PropertyFilter";
import type { Filter } from "../ast/filters/Filter";
import { isRelationshipOperator } from "../ast/filters/Filter";
import type { QueryASTFactory } from "./QueryASTFactory";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { parseWhereField } from "./parsers/parse-where-field";
import type { GraphQLWhereArg } from "../../../types";
import { RelationshipFilter } from "../ast/filters/RelationshipFilter";
import type { RelationshipWhereOperator } from "../../where/types";

export class FilterFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createFilters(entity: ConcreteEntity, where: Record<string, unknown>): Array<Filter> {
        return Object.entries(where).map(([key, value]) => {
            const { fieldName, operator, isNot, isConnection } = parseWhereField(key);
            const relationship = entity.findRelationship(fieldName);
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
            if (!attr) throw new Error("No attribute found");

            return new PropertyFilter({
                attribute: attr,
                comparisonValue: value,
                isNot,
                operator,
            });
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
            operator: filterOps.operator,
        });

        const targetNode = relationship.target as ConcreteEntity; // TODO: accept entities
        const targetNodeFilters = this.createFilters(targetNode, where);

        relationshipFilter.addTargetNodeFilter(...targetNodeFilters);

        return relationshipFilter;
    }
}
