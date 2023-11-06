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
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
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
        entity: ConcreteEntityAdapter,
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

    private createAuthFilterRule({
        entity,
        authAnnotation,
        operations,
        context,
    }: {
        entity: ConcreteEntityAdapter;
        authAnnotation: AuthorizationAnnotation;
        operations: AuthorizationOperation[];
        context: Neo4jGraphQLTranslationContext;
    }): AuthorizationFilters {
        const rulesMatchingOperations = findMatchingRules(authAnnotation.validate ?? [], operations);
        const rulesMatchingWhereOperations = findMatchingRules(authAnnotation.filter ?? [], operations);

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
            validationFilters: validationFilers,
            whereFilters: whereFilters,
        });
    }
}
