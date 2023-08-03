import Cypher from "@neo4j/cypher-builder";
import { Filter } from "../Filter";
import type { Relationship } from "../../../../../schema-model/relationship/Relationship";
import type { CountFilter } from "./CountFilter";
import { getRelationshipDirection } from "../../../utils/get-relationship-direction";
import type { ConcreteEntity } from "../../../../../schema-model/entity/ConcreteEntity";
import type { AggregationPropertyFilter } from "./AggregationPropertyFilter";
import type { LogicalFilter } from "../LogicalFilter";

export class AggregationFilter extends Filter {
    private relationship: Relationship;

    private filters: Array<CountFilter | LogicalFilter> = [];
    private nodeFilters: Array<AggregationPropertyFilter | LogicalFilter> = [];
    private edgeFilters: Array<AggregationPropertyFilter | LogicalFilter> = [];

    private subqueryVariables: Array<Cypher.Variable> = [];

    constructor(relationship: Relationship) {
        super();
        this.relationship = relationship;
    }

    public addFilter(filter: CountFilter | LogicalFilter) {
        this.filters.push(filter);
    }

    public addNodeFilters(filters: Array<AggregationPropertyFilter | LogicalFilter>) {
        this.nodeFilters.push(...filters);
    }

    public addEdgeFilters(filters: Array<AggregationPropertyFilter | LogicalFilter>) {
        this.edgeFilters.push(...filters);
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

        const predicates = Cypher.or(...this.filters.map((f) => f.getPredicate(relatedNode)));
        const nodePredicates = Cypher.or(...this.nodeFilters.map((f) => f.getPredicate(relatedNode)));
        const edgePredicates = Cypher.or(...this.edgeFilters.map((f) => f.getPredicate(relationshipTarget)));

        const returnColumns: Cypher.ProjectionColumn[] = [];

        if (predicates) {
            const newVar = new Cypher.Variable();
            this.subqueryVariables.push(newVar);
            returnColumns.push([predicates, newVar]);
        }
        if (nodePredicates) {
            const newVar = new Cypher.Variable();
            this.subqueryVariables.push(newVar);
            returnColumns.push([nodePredicates, newVar]);
        }
        if (edgePredicates) {
            const newVar = new Cypher.Variable();
            this.subqueryVariables.push(newVar);
            returnColumns.push([edgePredicates, newVar]);
        }

        if (returnColumns.length === 0) return []; // Maybe throw?

        const subquery = new Cypher.Match(pattern).return(...returnColumns);

        return [subquery];
    }

    public getPredicate(variable: Cypher.Variable): Cypher.Predicate | undefined {
        const trueLiteral = new Cypher.Literal(true);
        const subqueryPredicates = this.subqueryVariables.map((v) => Cypher.eq(v, trueLiteral));
        return Cypher.and(...subqueryPredicates);
    }
}
