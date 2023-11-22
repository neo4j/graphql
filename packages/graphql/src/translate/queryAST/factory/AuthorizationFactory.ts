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

import type { AuthorizationAnnotation } from "../../../schema-model/annotation/AuthorizationAnnotation";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { AuthorizationOperation } from "../../../types/authorization";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { findMatchingRules } from "../../authorization/utils/find-matching-rules";
import { populateWhereParams } from "../../authorization/utils/populate-where-params";
import { AuthorizationFilters } from "../ast/filters/authorization-filters/AuthorizationFilters";
import { AuthorizationRuleFilter } from "../ast/filters/authorization-filters/AuthorizationRuleFilter";
import type { AuthFilterFactory } from "./AuthFilterFactory";

export class AuthorizationFactory {
    private filterFactory: AuthFilterFactory;

    constructor(filterFactory: AuthFilterFactory) {
        this.filterFactory = filterFactory;
    }

    public createEntityAuthFilters(
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter,
        operations: AuthorizationOperation[],
        context: Neo4jGraphQLTranslationContext
    ): AuthorizationFilters | undefined {
        const authAnnotation = entity.annotations.authorization;
        if (!authAnnotation) return undefined;
        return this.createAuthFilterRule({
            entity,
            operations,
            context,
            authAnnotation,
        });
    }

    public createAttributeAuthFilters(
        attribute: AttributeAdapter,
        entity: ConcreteEntityAdapter,
        operations: AuthorizationOperation[],
        context: Neo4jGraphQLTranslationContext
    ): AuthorizationFilters | undefined {
        const authAnnotation = attribute.annotations.authorization;
        if (!authAnnotation) return undefined;
        return this.createAuthFilterRule({
            entity,
            operations,
            context,
            authAnnotation,
        });
    }

    public createEntityAuthValidate(
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter,
        operations: AuthorizationOperation[],
        context: Neo4jGraphQLTranslationContext,
        when: "BEFORE" | "AFTER"
    ): AuthorizationFilters | undefined {
        const authAnnotation = entity.annotations.authorization;
        if (!authAnnotation) return undefined;
        return this.createAuthValidateRule({
            entity,
            operations,
            context,
            authAnnotation,
            when,
        });
    }

    public createAttributeAuthValidate(
        attribute: AttributeAdapter,
        entity: ConcreteEntityAdapter,
        operations: AuthorizationOperation[],
        context: Neo4jGraphQLTranslationContext,
        when: "BEFORE" | "AFTER",
        conditionForEvaluation?: Cypher.Predicate
    ): AuthorizationFilters | undefined {
        const authAnnotation = attribute.annotations.authorization;
        if (!authAnnotation) return undefined;
        return this.createAuthValidateRule({
            entity,
            operations,
            context,
            authAnnotation,
            when,
            conditionForEvaluation,
        });
    }

    private createAuthFilterRule({
        entity,
        authAnnotation,
        operations,
        context,
    }: {
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter;
        authAnnotation: AuthorizationAnnotation;
        operations: AuthorizationOperation[];
        context: Neo4jGraphQLTranslationContext;
    }): AuthorizationFilters {
        const rulesMatchingWhereOperations = findMatchingRules(authAnnotation.filter ?? [], operations);

        const whereFilters = rulesMatchingWhereOperations.flatMap((rule) => {
            const populatedWhere = populateWhereParams({ where: rule.where, context });
            const nestedFilters = this.filterFactory.createAuthFilters({
                entity,
                operations,
                context,
                populatedWhere,
            });

            return new AuthorizationRuleFilter({
                requireAuthentication: rule.requireAuthentication,
                filters: nestedFilters,
                isAuthenticatedParam: context.authorization.isAuthenticatedParam,
            });
        });

        return new AuthorizationFilters({
            validationFilters: [],
            whereFilters: whereFilters,
        });
    }

    private createAuthValidateRule({
        entity,
        authAnnotation,
        operations,
        context,
        when,
        conditionForEvaluation,
    }: {
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter;
        authAnnotation: AuthorizationAnnotation;
        operations: AuthorizationOperation[];
        context: Neo4jGraphQLTranslationContext;
        when: "BEFORE" | "AFTER";
        conditionForEvaluation?: Cypher.Predicate;
    }): AuthorizationFilters {
        const rulesMatchingOperations = findMatchingRules(authAnnotation.validate ?? [], operations).filter((rule) =>
            rule.when.includes(when)
        );

        const validationFilers = rulesMatchingOperations.flatMap((rule) => {
            const populatedWhere = populateWhereParams({ where: rule.where, context }); // TODO: move this to the filterFactory?

            const nestedFilters = this.filterFactory.createAuthFilters({
                entity,
                operations,
                context,
                populatedWhere,
            });
            return new AuthorizationRuleFilter({
                requireAuthentication: rule.requireAuthentication,
                filters: nestedFilters,
                isAuthenticatedParam: context.authorization.isAuthenticatedParam,
            });
        });

        return new AuthorizationFilters({
            validationFilters: validationFilers,
            whereFilters: [],
            conditionForEvaluation,
        });
    }
}
