import Cypher from "@neo4j/cypher-builder";
import { QueryASTNode } from "../../QueryASTNode";
import type { LogicalFilter } from "../LogicalFilter";
import type { PropertyFilter } from "../PropertyFilter";

export class ConnectionEdgeFilter extends QueryASTNode {
    private filters: Array<LogicalFilter | PropertyFilter> = [];
    private isNot: boolean;

    constructor({ isNot, filters }: { isNot: boolean; filters: Array<LogicalFilter | PropertyFilter> }) {
        super();
        this.isNot = isNot;
        this.filters = filters;
    }

    public getPredicate(relationship: Cypher.Relationship): Cypher.Predicate | undefined {
        const predicates = this.filters.map((f) => f.getPredicate(relationship));

        const andPredicate = Cypher.and(...predicates);

        return this.wrapInNotIfNeeded(andPredicate);
    }

    private wrapInNotIfNeeded(predicate: Cypher.Predicate | undefined): Cypher.Predicate | undefined {
        if (!predicate) return undefined;
        if (this.isNot) return Cypher.not(predicate);
        else return predicate;
    }
}
