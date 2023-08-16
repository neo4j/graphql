import type { Predicate } from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../../QueryASTContext";
import { Filter } from "../Filter";
import Cypher from "@neo4j/cypher-builder";

export class NullabilityCheck extends Filter {
    private child: Filter;
    private check: Cypher.Expr;

    constructor({ child, check }: { child: Filter; check: Cypher.Expr }) {
        super();
        this.child = child;
        this.check = check;
    }

    public getSubqueries(parentNode: Cypher.Node): Cypher.Clause[] {
        return this.child.getSubqueries(parentNode);
    }

    public getPredicate(context: QueryASTContext): Predicate | undefined {
        const predicate = this.child.getPredicate(context);
        const check = Cypher.isNull(this.check);

        const innerPredicate = Cypher.and(check, predicate);
        return innerPredicate;
    }
}
