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
import { ParamPropertyFilter } from "../ast/filters/property-filters/ParamPropertyFilter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipFilter } from "../ast/filters/RelationshipFilter";
import { AuthRelationshipFilter } from "../ast/filters/authorization-filters/AuthRelationshipFilter";
import type { Filter } from "../ast/filters/Filter";
import type { GraphQLWhereArg } from "../../../types";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { AuthorizationOperation } from "../../../types/authorization";
import { isLogicalOperator } from "../../utils/logical-operators";
import Cypher from "@neo4j/cypher-builder";
import { parseWhereField } from "./parsers/parse-where-field";
import { JWTFilter } from "../ast/filters/authorization-filters/JWTFilter";
import { PropertyFilter } from "../ast/filters/property-filters/PropertyFilter";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { createParameterWhere } from "../../where/create-parameter-where";

export class AuthFilterFactory extends FilterFactory {
    // PopulatedWhere has the values as Cypher variables
    public createAuthFilters({
        entity,
        operations,
        context,
        populatedWhere,
    }: {
        entity: ConcreteEntityAdapter;
        operations: AuthorizationOperation[];
        context: Neo4jGraphQLTranslationContext;
        populatedWhere: GraphQLWhereArg;
    }): Filter[] {
        const nestedFilters: Filter[] = Object.entries(populatedWhere).flatMap(([key, value]): Filter[] => {
            if (isLogicalOperator(key)) {
                // return this.createEdgeLogicalFilter(key, value as any, relationship);
            }

            if (key === "node") {
                return this.createNodeFilters(entity, value);
                // nestedFilters.push(...this.createNodeFilters(entity, populatedWhere.node));
            } else if (key === "jwt") {
                return this.createJWTFilters(context.authorization.jwtParam, value, context);
            }

            return [];
        });

        // LogicalFilters

        return nestedFilters;
    }

    private createJWTFilters(
        jwtPayload: Cypher.Param,
        where: Record<string, unknown>,
        context: Neo4jGraphQLTranslationContext
    ): Filter[] {
        return Object.entries(where).map(([key, value]) => {
            const { fieldName, operator } = parseWhereField(key);
            if (!fieldName) {
                throw new Error(`Failed to find field name in filter: ${key}`);
            }

            if (!operator) {
                throw new Error(`Failed to find operator in filter: ${key}`);
            }

            const mappedJwtClaim = context.authorization.claims?.get(fieldName);

            let target: Cypher.Property = jwtPayload.property(fieldName);

            if (mappedJwtClaim) {
                // TODO: validate browser compatibility for Toolbox (https://caniuse.com/?search=Lookbehind)
                let paths = mappedJwtClaim.split(/(?<!\\)\./);

                paths = paths.map((p) => p.replaceAll(/\\\./g, "."));

                target = jwtPayload.property(...paths);
            }
            return new JWTFilter({
                operator: operator || "EQ",
                JWTClaim: target,
                comparisonValue: value,
            });
        });
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

        const isCypherVariable =
            comparisonValue instanceof Cypher.Variable ||
            comparisonValue instanceof Cypher.Property ||
            comparisonValue instanceof Cypher.Param;

        if (isCypherVariable) {
            return new ParamPropertyFilter({
                attribute,
                comparisonValue: comparisonValue,
                isNot,
                operator: filterOperator,
                attachedTo,
            });
        } else {
            return new PropertyFilter({
                attribute,
                comparisonValue: comparisonValue,
                isNot,
                operator: filterOperator,
                attachedTo,
            });
        }
    }

    protected createRelationshipFilterTreeNode(options: {
        relationship: RelationshipAdapter;
        isNot: boolean;
        operator: RelationshipWhereOperator;
    }): RelationshipFilter {
        return new AuthRelationshipFilter(options);
    }
}
