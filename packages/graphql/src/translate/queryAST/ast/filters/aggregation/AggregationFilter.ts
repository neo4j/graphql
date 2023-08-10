import Cypher from "@neo4j/cypher-builder";
import { Filter } from "../Filter";
import type { CountFilter } from "./CountFilter";
import { getRelationshipDirection } from "../../../utils/get-relationship-direction";
import type { ConcreteEntity } from "../../../../../schema-model/entity/ConcreteEntity";
import type { AggregationPropertyFilter } from "./AggregationPropertyFilter";
import type { LogicalFilter } from "../LogicalFilter";
import { QueryASTContext } from "../../QueryASTContext";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export class AggregationFilter extends Filter {
    private relationship: RelationshipAdapter;

    private filters: Array<AggregationPropertyFilter | CountFilter | LogicalFilter> = [];

    private subqueryVariables: Array<Cypher.Variable> = [];

    constructor(relationship: RelationshipAdapter) {
        super();
        this.relationship = relationship;
    }

    public addFilters(...filter: Array<AggregationPropertyFilter | CountFilter | LogicalFilter>) {
        this.filters.push(...filter);
    }

    public getSubqueries(parentNode: Cypher.Node): Cypher.Clause[] {
        const relatedEntity = this.relationship.target as ConcreteEntity;
        const relatedNode = new Cypher.Node({
            labels: relatedEntity.labels,
        });

        const relationshipTarget = new Cypher.Relationship({
            type: this.relationship.type,
        });

        const pattern = new Cypher.Pattern(parentNode)
            .withoutLabels()
            .related(relationshipTarget)
            .withDirection(getRelationshipDirection(this.relationship))
            .to(relatedNode);

        const nestedContext = new QueryASTContext({
            target: relatedNode,
            relationship: relationshipTarget,
            source: parentNode,
        });

        const predicates = Cypher.or(...this.filters.map((f) => f.getPredicate(nestedContext)));

        const returnColumns: Cypher.ProjectionColumn[] = [];

        if (predicates) {
            const newVar = new Cypher.Variable();
            this.subqueryVariables.push(newVar);
            returnColumns.push([predicates, newVar]);
        }

        if (returnColumns.length === 0) return []; // Maybe throw?

        const subquery = new Cypher.Match(pattern).return(...returnColumns);

        return [subquery];
    }

    public getPredicate(_queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const trueLiteral = new Cypher.Literal(true);
        const subqueryPredicates = this.subqueryVariables.map((v) => Cypher.eq(v, trueLiteral));
        return Cypher.and(...subqueryPredicates);
    }
}
