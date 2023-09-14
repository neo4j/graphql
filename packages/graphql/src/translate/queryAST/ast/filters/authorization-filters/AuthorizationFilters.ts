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

import Cypher from "@neo4j/cypher-builder";
import { AUTH_FORBIDDEN_ERROR } from "../../../../../constants";
import type { QueryASTContext } from "../../QueryASTContext";
import { Filter } from "../Filter";
import type { AuthorizationRuleFilter } from "./AuthorizationRuleFilter";
import type { QueryASTNode } from "../../QueryASTNode";

export class AuthorizationFilters extends Filter {
    private validationFilters: AuthorizationRuleFilter[] = [];
    private whereFilters: AuthorizationRuleFilter[] = [];

    constructor({
        validationFilters,
        whereFilters,
    }: {
        validationFilters: AuthorizationRuleFilter[];
        whereFilters: AuthorizationRuleFilter[];
    }) {
        super();
        this.validationFilters = validationFilters;
        this.whereFilters = whereFilters;
    }

    public addValidationFilter(filter: AuthorizationRuleFilter) {
        this.validationFilters.push(filter);
    }

    public addWhereFilter(filter: AuthorizationRuleFilter) {
        this.whereFilters.push(filter);
    }

    public getPredicate(context: QueryASTContext): Cypher.Predicate | undefined {
        const validateInnerPredicate = Cypher.or(...this.validationFilters.map((f) => f.getPredicate(context)));
        const wherePredicate = Cypher.or(...this.whereFilters.map((f) => f.getPredicate(context)));

        let validatePredicate: Cypher.Predicate | undefined;
        if (validateInnerPredicate) {
            validatePredicate = Cypher.apoc.util.validatePredicate(
                Cypher.not(validateInnerPredicate),
                AUTH_FORBIDDEN_ERROR
            );
        }

        return Cypher.and(validatePredicate, wherePredicate);
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return [...this.validationFilters, ...this.whereFilters].flatMap((c) => c.getSubqueries(context));
    }

    public getSelection(context: QueryASTContext): Array<Cypher.Match | Cypher.With> {
        return [...this.validationFilters, ...this.whereFilters].flatMap((c) => c.getSelection(context));
    }

    public getChildren(): QueryASTNode[] {
        return [...this.validationFilters, ...this.whereFilters];
    }
}
