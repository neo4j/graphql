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

import { asArray } from "@graphql-tools/utils";
import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { GraphQLWhereArg } from "../../../types";
import type { AuthorizationOperation } from "../../../schema-model/annotation/AuthorizationAnnotation";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { isLogicalOperator } from "../../utils/logical-operators";
import type { RelationshipWhereOperator, WhereOperator } from "../../where/types";
import type { ConnectionFilter } from "../ast/filters/ConnectionFilter";
import type { Filter } from "../ast/filters/Filter";
import { LogicalFilter } from "../ast/filters/LogicalFilter";
import type { RelationshipFilter } from "../ast/filters/RelationshipFilter";
import { AuthConnectionFilter } from "../ast/filters/authorization-filters/AuthConnectionFilter";
import { AuthRelationshipFilter } from "../ast/filters/authorization-filters/AuthRelationshipFilter";
import { JWTFilter } from "../ast/filters/authorization-filters/JWTFilter";
import { ParamPropertyFilter } from "../ast/filters/property-filters/ParamPropertyFilter";
import { PropertyFilter } from "../ast/filters/property-filters/PropertyFilter";
import { FilterFactory } from "./FilterFactory";
import { parseWhereField } from "./parsers/parse-where-field";

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
        return Object.entries(populatedWhere).flatMap(([key, value]): Filter[] => {
            if (isLogicalOperator(key)) {
                const nestedFilters = value.flatMap((v) => {
                    return this.createAuthFilters({
                        entity,
                        operations,
                        context,
                        populatedWhere: v,
                    });
                });

                return [
                    new LogicalFilter({
                        operation: key,
                        filters: nestedFilters,
                    }),
                ];
            }

            if (key === "node") {
                return this.createNodeFilters(entity, value);
            } else if (key === "jwt") {
                return this.createJWTFilters(context.authorization.jwtParam, value, context);
            }

            return [];
        });
    }

    private createJWTFilters(
        jwtPayload: Cypher.Param,
        where: GraphQLWhereArg,
        context: Neo4jGraphQLTranslationContext
    ): Filter[] {
        return Object.entries(where).map(([key, value]) => {
            if (isLogicalOperator(key)) {
                const nestedFilters = asArray(value).flatMap((v) => {
                    return this.createJWTFilters(jwtPayload, v, context);
                });

                return new LogicalFilter({
                    operation: key,
                    filters: nestedFilters,
                });
            }
            const { fieldName, operator, isNot } = parseWhereField(key);
            if (!fieldName) {
                throw new Error(`Failed to find field name in filter: ${key}`);
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
                isNot,
            });
        });
    }

    public createPropertyFilter({
        attribute,
        comparisonValue,
        operator,
        isNot,
        attachedTo,
        relationship,
    }: {
        attribute: AttributeAdapter;
        comparisonValue: unknown;
        operator: WhereOperator | undefined;
        isNot: boolean;
        attachedTo?: "node" | "relationship";
        relationship?: RelationshipAdapter;
    }): PropertyFilter {
        const filterOperator = operator || "EQ";

        // This is probably not needed, but avoid changing the cypher
        if (typeof comparisonValue === "boolean") {
            return new ParamPropertyFilter({
                attribute,
                relationship,
                comparisonValue: new Cypher.Param(comparisonValue),
                isNot,
                operator: filterOperator,
                attachedTo,
            });
        }

        const isCypherVariable =
            comparisonValue instanceof Cypher.Variable ||
            comparisonValue instanceof Cypher.Property ||
            comparisonValue instanceof Cypher.Param;

        if (isCypherVariable) {
            return new ParamPropertyFilter({
                attribute,
                relationship,
                comparisonValue: comparisonValue,
                isNot,
                operator: filterOperator,
                attachedTo,
            });
        } else {
            if (comparisonValue === null) {
                return new PropertyFilter({
                    attribute,
                    relationship,
                    comparisonValue: comparisonValue,
                    isNot,
                    operator: filterOperator,
                    attachedTo,
                });
            }
            return new ParamPropertyFilter({
                attribute,
                relationship,
                comparisonValue: new Cypher.Param(comparisonValue),
                isNot,
                operator: filterOperator,
                attachedTo,
            });
        }
    }

    protected createRelationshipFilterTreeNode(options: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter | InterfaceEntityAdapter;
        isNot: boolean;
        operator: RelationshipWhereOperator;
    }): RelationshipFilter {
        return new AuthRelationshipFilter(options);
    }

    protected createConnectionFilterTreeNode(options: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter | InterfaceEntityAdapter;
        isNot: boolean;
        operator: RelationshipWhereOperator | undefined;
    }): ConnectionFilter {
        return new AuthConnectionFilter(options);
    }
}
