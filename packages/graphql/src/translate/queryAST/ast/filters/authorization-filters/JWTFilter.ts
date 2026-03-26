/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Predicate } from "@neo4j/cypher-builder";
import Cypher from "@neo4j/cypher-builder";
import { createComparisonOperation } from "../../../utils/create-comparison-operator";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { FilterOperator } from "../Filter";
import { Filter } from "../Filter";

export class JWTFilter extends Filter {
    protected operator: FilterOperator;
    protected JWTClaim: Cypher.Property;
    protected comparisonValue: unknown;

    constructor({
        operator,
        JWTClaim,
        comparisonValue,
    }: {
        operator: FilterOperator;
        JWTClaim: Cypher.Property;
        comparisonValue: unknown;
    }) {
        super();
        this.operator = operator;
        this.JWTClaim = JWTClaim;
        this.comparisonValue = comparisonValue;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }
    public print(): string {
        return `${super.print()} <${this.operator} ${this.comparisonValue}>`;
    }
    public getPredicate(_context: QueryASTContext): Predicate | undefined {
        const predicate = createComparisonOperation({
            operator: this.operator,
            property: this.JWTClaim,
            param: new Cypher.Param(this.comparisonValue),
        });

        return Cypher.and(Cypher.isNotNull(this.JWTClaim), predicate);
    }
}
