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

import type Cypher from "@neo4j/cypher-builder";
import type {
    AuthorizationAnnotation,
    AuthorizationOperation,
    BaseAuthorizationRule,
    ValidateWhen,
} from "../../../schema-model/annotation/AuthorizationAnnotation";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { filterTruthy } from "../../../utils/utils";
import { populateWhereParams } from "../../authorization/utils/populate-where-params";
import { AuthorizationFilters } from "../ast/filters/authorization-filters/AuthorizationFilters";
import { AuthorizationRuleFilter } from "../ast/filters/authorization-filters/AuthorizationRuleFilter";
import { isConcreteEntity } from "../utils/is-concrete-entity";
import type { AuthFilterFactory } from "./AuthFilterFactory";

type AuthParams = {
    entity: ConcreteEntityAdapter;
    operations: AuthorizationOperation[];
    context: Neo4jGraphQLTranslationContext;
};

type AuthFilterParams = AuthParams & {
    authAnnotation: AuthorizationAnnotation | undefined;
};
type AuthValidateParams = AuthParams & {
    when: ValidateWhen;
    conditionForEvaluation?: Cypher.Predicate;
    authAnnotation: AuthorizationAnnotation | undefined;
};

export class AuthorizationFactory {
    constructor(private filterFactory: AuthFilterFactory) {}
    // TODO: rename this to getProjectionAuthFilters
    public getAuthFilters({
        attributes,
        ...params
    }: AuthParams & {
        attributes?: AttributeAdapter[];
    }): AuthorizationFilters[] {
        const authorizationFilters = this.createAuthFilterRule({
            ...params,
            authAnnotation: params.entity.annotations.authorization,
        });
        const authorizationValidate = this.createAuthValidateRule({
            ...params,
            authAnnotation: params.entity.annotations.authorization,
            when: "BEFORE",
        });

        const attributeAuthFilters: (AuthorizationFilters | undefined)[] = [];
        const attributeAuthValidate: (AuthorizationFilters | undefined)[] = [];
        if (attributes?.length && isConcreteEntity(params.entity)) {
            for (const attribute of attributes) {
                attributeAuthFilters.push(
                    this.createAuthFilterRule({
                        ...params,
                        authAnnotation: attribute.annotations.authorization,
                    })
                );
                attributeAuthValidate.push(
                    this.createAuthValidateRule({
                        ...params,
                        when: "BEFORE",
                        authAnnotation: attribute.annotations.authorization,
                    })
                );
            }
        }

        return filterTruthy([
            authorizationFilters,
            ...attributeAuthFilters,
            authorizationValidate,
            ...attributeAuthValidate,
        ]);
    }

    public createAuthFilterRule({ authAnnotation, ...params }: AuthFilterParams): AuthorizationFilters | undefined {
        const whereFilters = this.createAuthRuleFilter(params, authAnnotation?.filter ?? []);
        if (!whereFilters.length) {
            return;
        }
        return new AuthorizationFilters({ validationFilters: [], whereFilters });
    }

    public createAuthValidateRule({
        authAnnotation,
        when,
        conditionForEvaluation,
        ...params
    }: AuthValidateParams): AuthorizationFilters | undefined {
        const rules = authAnnotation?.validate?.filter((rule) => rule.when.includes(when));
        const validationFilters = this.createAuthRuleFilter(params, rules ?? []);
        if (!validationFilters.length) {
            return;
        }
        return new AuthorizationFilters({ validationFilters, whereFilters: [], conditionForEvaluation });
    }

    private createAuthRuleFilter(
        params: AuthParams,
        rules: BaseAuthorizationRule<AuthorizationOperation>[]
    ): AuthorizationRuleFilter[] {
        return rules
            .filter((rule) => rule.operations.some((operation) => params.operations.includes(operation)))
            .map((rule) => {
                const populatedWhere = populateWhereParams({ where: rule.where, context: params.context });
                const nestedFilters = this.filterFactory.createAuthFilters({ ...params, populatedWhere });
                return new AuthorizationRuleFilter({
                    requireAuthentication: rule.requireAuthentication,
                    filters: nestedFilters,
                    isAuthenticatedParam: params.context.authorization.isAuthenticatedParam,
                });
            });
    }
}
