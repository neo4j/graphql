/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { AUTH_FORBIDDEN_ERROR } from "../../../../../constants";
import type { ValidateWhen } from "../../../../../schema-model/annotation/AuthorizationAnnotation";
import { apocWrapper } from "../../../../utils/apoc-wrapper";
import type { QueryASTContext } from "../../QueryASTContext";
import { QueryASTNode } from "../../QueryASTNode";
import type { AuthorizationRuleFilter } from "./AuthorizationRuleFilter";

export class AuthorizationFilters extends QueryASTNode {
    private validations: AuthorizationRuleFilter[] = [];
    private filters: AuthorizationRuleFilter[] = [];
    private conditionForEvaluation: Cypher.Predicate | undefined;

    constructor({
        validations,
        filters,
        conditionForEvaluation,
    }: {
        validations: AuthorizationRuleFilter[];
        filters: AuthorizationRuleFilter[];
        conditionForEvaluation?: Cypher.Predicate;
    }) {
        super();
        this.validations = validations;
        this.filters = filters;
        this.conditionForEvaluation = conditionForEvaluation;
    }

    public getPredicate(context: QueryASTContext): Cypher.Predicate | undefined {
        return Cypher.or(...this.filters.map((f) => f.getPredicate(context)));
    }

    public getValidation(context: QueryASTContext, when: ValidateWhen = "BEFORE"): Cypher.VoidProcedure | undefined {
        const validationPredicate = Cypher.or(
            ...this.getValidations(when).flatMap((validationRule) => validationRule.getPredicate(context))
        );
        if (validationPredicate) {
            const predicate = this.conditionForEvaluation
                ? Cypher.and(this.conditionForEvaluation, Cypher.not(validationPredicate))
                : Cypher.not(validationPredicate);
            return apocWrapper.validate(predicate, AUTH_FORBIDDEN_ERROR);
        }

        return;
    }

    public getValidationPredicate(
        context: QueryASTContext,
        when: ValidateWhen = "BEFORE"
    ): Cypher.Predicate | undefined {
        const validationPredicate = Cypher.or(
            ...this.getValidations(when).flatMap((validationRule) => validationRule.getPredicate(context))
        );
        return validationPredicate;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return [...this.validations, ...this.filters].flatMap((c) => c.getSubqueries(context));
    }

    public getSubqueriesBefore(context: QueryASTContext): Cypher.Clause[] {
        return [...this.validations.filter((v) => v.when === "BEFORE"), ...this.filters].flatMap((c) =>
            c.getSubqueries(context)
        );
    }

    public getSubqueriesAfter(context: QueryASTContext): Cypher.Clause[] {
        return [...this.validations.filter((v) => v.when === "AFTER")].flatMap((c) => c.getSubqueries(context));
    }

    public getSelection(context: QueryASTContext): Array<Cypher.Match | Cypher.With> {
        return [...this.validations, ...this.filters].flatMap((c) => c.getSelection(context));
    }

    public getChildren(): QueryASTNode[] {
        return [...this.validations, ...this.filters];
    }

    private getValidations(when: ValidateWhen): AuthorizationRuleFilter[] {
        return this.validations.filter((rule) => rule.when === when);
    }
}
