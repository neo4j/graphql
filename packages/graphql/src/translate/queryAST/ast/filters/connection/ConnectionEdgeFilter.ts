import Cypher from "@neo4j/cypher-builder";
import type { QueryASTNode } from "../../QueryASTNode";
import type { LogicalFilter } from "../LogicalFilter";
import type { PropertyFilter } from "../property-filters/PropertyFilter";
import { Filter } from "../Filter";

export class ConnectionEdgeFilter extends Filter {
    private filters: Array<LogicalFilter | PropertyFilter> = [];
    private isNot: boolean;

    constructor({ isNot, filters }: { isNot: boolean; filters: Array<LogicalFilter | PropertyFilter> }) {
        super();
        this.isNot = isNot;
        this.filters = filters;
    }

    public get children(): QueryASTNode[] {
        return [];
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
