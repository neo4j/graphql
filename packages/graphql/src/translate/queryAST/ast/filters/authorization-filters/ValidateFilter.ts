import type { Predicate } from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../../QueryASTContext";
import { Filter } from "../Filter";
import Cypher from "@neo4j/cypher-builder";
import { AUTH_FORBIDDEN_ERROR } from "../../../../../constants";

export class ValidateFilter extends Filter {
    private children: Filter[];

    constructor({ children }: { children: Filter[] }) {
        super();
        this.children = children;
    }

    public getSubqueries(parentNode: Cypher.Node): Cypher.Clause[] {
        return this.children.flatMap((c) => c.getSubqueries(parentNode));
    }

    public getPredicate(context: QueryASTContext): Predicate | undefined {
        const predicates = this.children.flatMap((c) => c.getPredicate(context));
        const innerPredicate = Cypher.and(...predicates);
        if (!innerPredicate) return undefined;
        return Cypher.apoc.util.validatePredicate(Cypher.not(innerPredicate), AUTH_FORBIDDEN_ERROR);
    }
}
