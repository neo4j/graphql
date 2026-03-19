/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { AUTH_FORBIDDEN_ERROR } from "../../../../../constants";
import { apocWrapper } from "../../../../utils/apoc-wrapper";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { Filter } from "../Filter";
import type { AuthorizationRuleFilter } from "./AuthorizationRuleFilter";

/**
 * @deprecated This class is deprecated and superseded by `AuthorizationFilters` which support the .getValidate method backed by apoc.util.validate.
 **/
export class AuthorizationFiltersDeprecated extends Filter {
    // Maybe we can merge these into a single array
    private validationFilters: AuthorizationRuleFilter[] = [];
    private whereFilters: AuthorizationRuleFilter[] = [];
    private conditionForEvaluation: Cypher.Predicate | undefined;

    constructor({
        validationFilters,
        whereFilters,
        conditionForEvaluation,
    }: {
        validationFilters: AuthorizationRuleFilter[];
        whereFilters: AuthorizationRuleFilter[];
        conditionForEvaluation?: Cypher.Predicate;
    }) {
        super();
        this.validationFilters = validationFilters;
        this.whereFilters = whereFilters;
        this.conditionForEvaluation = conditionForEvaluation;
    }

    public getPredicate(context: QueryASTContext): Cypher.Predicate | undefined {
        const validateInnerPredicate = Cypher.or(...this.validationFilters.map((f) => f.getPredicate(context)));
        const wherePredicate = Cypher.or(...this.whereFilters.map((f) => f.getPredicate(context)));

        let validatePredicate: Cypher.Predicate | undefined;
        if (validateInnerPredicate) {
            const predicate = this.conditionForEvaluation
                ? Cypher.and(this.conditionForEvaluation, Cypher.not(validateInnerPredicate))
                : Cypher.not(validateInnerPredicate);
            validatePredicate = apocWrapper.validatePredicate(predicate, AUTH_FORBIDDEN_ERROR);
        }

        return Cypher.and(wherePredicate, validatePredicate);
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
