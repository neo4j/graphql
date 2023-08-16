import type { Predicate } from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../../QueryASTContext";
import type { FilterOperator } from "../Filter";
import { Filter } from "../Filter";
import Cypher from "@neo4j/cypher-builder";
import { createComparisonOperation } from "../../../utils/create-comparison-operator";

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

    public getPredicate(context: QueryASTContext): Predicate | undefined {
        return createComparisonOperation({
            operator: this.operator,
            property: this.JWTClaim,
            param: new Cypher.Param(this.comparisonValue),
        });
    }
}
