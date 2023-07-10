import Cypher from "@neo4j/cypher-builder";
import { QueryASTNode } from "../../QueryASTNode";
import type { Filter } from "../Filter";

export class ConnectionNodeFilter extends QueryASTNode {
    private filters: Filter[] = [];
    private isNot: boolean;

    constructor({ isNot, filters }: { isNot: boolean; filters: Filter[] }) {
        super();
        this.isNot = isNot;
        this.filters = filters;
    }

    public getPredicate(node: Cypher.Node): Cypher.Predicate | undefined {
        const predicates = this.filters.map((f) => f.getPredicate(node));

        const andPredicate = Cypher.and(...predicates);
        return this.wrapInNotIfNeeded(andPredicate);
    }

    private wrapInNotIfNeeded(predicate: Cypher.Predicate | undefined): Cypher.Predicate | undefined {
        if (!predicate) return undefined;
        if (this.isNot) return Cypher.not(predicate);
        else return predicate;
    }
}
