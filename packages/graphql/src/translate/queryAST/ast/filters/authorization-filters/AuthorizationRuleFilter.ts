/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { ValidateWhen } from "../../../../../schema-model/annotation/AuthorizationAnnotation";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { Filter } from "../Filter";

export class AuthorizationRuleFilter extends Filter {
    public children: Filter[];
    private requireAuthentication: boolean;
    private isAuthenticatedParam: Cypher.Param;
    public when: ValidateWhen;

    constructor({
        requireAuthentication,
        filters,
        isAuthenticatedParam,
        when = "BEFORE",
    }: {
        requireAuthentication: boolean;
        filters: Filter[];
        isAuthenticatedParam: Cypher.Param;
        when?: ValidateWhen;
    }) {
        super();
        this.requireAuthentication = requireAuthentication;
        this.children = filters;
        this.isAuthenticatedParam = isAuthenticatedParam;
        this.when = when;
    }

    public print(): string {
        return `${super.print()} <${this.when}>`;
    }

    public getPredicate(context: QueryASTContext): Cypher.Predicate | undefined {
        let authenticationPredicate: Cypher.Predicate | undefined;
        if (this.requireAuthentication) {
            authenticationPredicate = Cypher.eq(this.isAuthenticatedParam, Cypher.true); // TODO: use it in the context
        }

        const innerPredicate = Cypher.and(
            authenticationPredicate,
            ...this.children.map((c) => c.getPredicate(context))
        );
        if (!innerPredicate) return undefined;
        return innerPredicate;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.children.flatMap((c) => c.getSubqueries(context));
    }

    public getSelection(context: QueryASTContext): Array<Cypher.Match | Cypher.With> {
        return this.children.flatMap((c) => c.getSelection(context));
    }

    public getChildren(): QueryASTNode[] {
        return [...this.children];
    }
}
