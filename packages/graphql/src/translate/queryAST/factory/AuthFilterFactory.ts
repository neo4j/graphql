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
import { FilterFactory } from "./FilterFactory";
import type { RelationshipWhereOperator, WhereOperator } from "../../where/types";
import { AuthPropertyFilter } from "../ast/filters/authorization-filters/AuthPropertyFilter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipFilter } from "../ast/filters/RelationshipFilter";
import { AuthRelationshipFilter } from "../ast/filters/authorization-filters/AuthRelationshipFilter";

export class AuthFilterFactory extends FilterFactory {
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
    }): AuthPropertyFilter {
        const filterOperator = operator || "EQ";
        // if (attribute.isDuration() || attribute.isListOf(Neo4jGraphQLTemporalType.Duration)) {
        //     return new DurationFilter({
        //         attribute,
        //         comparisonValue,
        //         isNot,
        //         operator: filterOperator,
        //         attachedTo,
        //     });
        // }
        // if (attribute.isPoint() || attribute.isListOf(Neo4jGraphQLSpatialType.Point)) {
        //     return new PointFilter({
        //         attribute,
        //         comparisonValue,
        //         isNot,
        //         operator: filterOperator,
        //         attachedTo,
        //     });
        // }

        return new AuthPropertyFilter({
            attribute,
            comparisonValue,
            isNot,
            operator: filterOperator,
            attachedTo,
        });
    }

    protected createRelationshipFilterTreeNode(options: {
        relationship: RelationshipAdapter;
        isNot: boolean;
        operator: RelationshipWhereOperator;
    }): RelationshipFilter {
        return new AuthRelationshipFilter(options);
    }
}
