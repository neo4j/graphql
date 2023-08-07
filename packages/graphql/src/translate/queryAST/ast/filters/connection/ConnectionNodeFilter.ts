import Cypher from "@neo4j/cypher-builder";
import { Filter } from "../Filter";
import type { QueryASTContext } from "../../QueryASTContext";

export class ConnectionNodeFilter extends Filter {
    private filters: Filter[] = [];
    private isNot: boolean;;

    constructor({ isNot, filters }: { isNot: boolean; filters: Filter[] }) {
        super();
        this.isNot = isNot;
        this.filters = filters;
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const predicates = this.filters.map((f) => f.getPredicate(queryASTContext));

        const andPredicate = Cypher.and(...predicates);
        return this.wrapInNotIfNeeded(andPredicate);
    }

    
    private wrapInNotIfNeeded(predicate: Cypher.Predicate | undefined): Cypher.Predicate | undefined {
        if (!predicate) return undefined;
        if (this.isNot) return Cypher.not(predicate);
        else return predicate;
    }
}
