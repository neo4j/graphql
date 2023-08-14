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

import type { Context } from "../../../types";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { AuthorizationFilter } from "../ast/filters/AuthorizationFilter";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type { AuthorizationOperation } from "../../../types/authorization";
import { findMatchingRules } from "../../authorization/utils/find-matching-rules";
import { populateWhereParams } from "../../authorization/utils/populate-where-params";
import type { AuthFilterFactory } from "./AuthFilterFactory";

export class AuthorizationFactory {
    private filterFactory: AuthFilterFactory;

    constructor(filterFactory: AuthFilterFactory) {
        this.filterFactory = filterFactory;
    }

    public createFieldsAuthFilters(
        entity: ConcreteEntityAdapter | RelationshipAdapter,
        rawFields: Record<string, ResolveTree>
    ): AuthorizationFilter[] {
        console.log(rawFields);

        return [];
    }

    public createEntityAuthFilters(
        entity: ConcreteEntityAdapter,
        operations: AuthorizationOperation[],
        context: Context
    ): AuthorizationFilter[] {
        const entityAuth = entity.annotations.authorization;
        if (!entityAuth) return [];

        const rulesMatchingOperations = findMatchingRules(entityAuth.validate ?? [], operations);

        return rulesMatchingOperations.flatMap((rule) => {
            const populatedWhere = populateWhereParams({ where: rule.where, context });
            const nestedFilters = this.filterFactory.createNodeFilters(entity, populatedWhere.node);
            return new AuthorizationFilter({
                requireAuthentication: rule.requireAuthentication,
                filters: nestedFilters,
                isAuthenticatedParam: context.authorization.isAuthenticatedParam,
            });
        });
    }
}
