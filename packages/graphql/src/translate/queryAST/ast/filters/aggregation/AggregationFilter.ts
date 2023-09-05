import Cypher from "@neo4j/cypher-builder";
import { Filter } from "../Filter";
import type { CountFilter } from "./CountFilter";
import type { ConcreteEntity } from "../../../../../schema-model/entity/ConcreteEntity";
import type { AggregationPropertyFilter } from "./AggregationPropertyFilter";
import type { LogicalFilter } from "../LogicalFilter";
import { QueryASTContext } from "../../QueryASTContext";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTNode } from "../../QueryASTNode";

export class AggregationFilter extends Filter {
    private relationship: RelationshipAdapter;

    private filters: Array<AggregationPropertyFilter | CountFilter | LogicalFilter> = [];

    private subqueryReturnVariable: Cypher.Variable | undefined;

    constructor(relationship: RelationshipAdapter) {
        super();
        this.relationship = relationship;
    }

    public addFilters(...filter: Array<AggregationPropertyFilter | CountFilter | LogicalFilter>) {
        this.filters.push(...filter);
    }

    public getChildren(): QueryASTNode[] {
        return [...this.filters];
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        this.subqueryReturnVariable = new Cypher.Variable();
        const relatedEntity = this.relationship.target as ConcreteEntity;
        const relatedNode = new Cypher.Node({
            labels: relatedEntity.labels,
        });

        const relationshipTarget = new Cypher.Relationship({
            type: this.relationship.type,
        });

        const pattern = new Cypher.Pattern(context.target)
            .withoutLabels()
            .related(relationshipTarget)
            .withDirection(this.relationship.getCypherDirection())
            .to(relatedNode);

        const nestedContext = context.push({
            target: relatedNode,
            relationship: relationshipTarget,
        });

        const predicates = Cypher.and(...this.filters.map((f) => f.getPredicate(nestedContext)));

        const returnColumns: Cypher.ProjectionColumn[] = [];

        if (predicates) {
            returnColumns.push([predicates, this.subqueryReturnVariable]);
        }

        if (returnColumns.length === 0) return []; // Maybe throw?

        const subquery = new Cypher.Match(pattern).return(...returnColumns);

        return [subquery];
    }

    public getPredicate(_queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (!this.subqueryReturnVariable) return undefined;
        return Cypher.eq(this.subqueryReturnVariable, Cypher.true);
    }
}
