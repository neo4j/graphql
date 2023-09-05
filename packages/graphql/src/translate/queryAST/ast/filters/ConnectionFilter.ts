import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { RelationshipWhereOperator } from "../../../where/types";
import { Filter } from "./Filter";
import { QueryASTContext } from "../QueryASTContext";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { QueryASTNode } from "../QueryASTNode";

export class ConnectionFilter extends Filter {
    private innerFilters: Filter[] = [];
    private relationship: RelationshipAdapter;
    private operator: RelationshipWhereOperator;
    private isNot: boolean;

    // Predicate generation for subqueries cannot be done separately from subqueries, so we need to create the predicates at the same time
    // as subqueries and store them
    private subqueryPredicate: Cypher.Predicate | undefined;

    constructor({
        relationship,
        operator,
        isNot,
    }: {
        relationship: RelationshipAdapter;
        operator: RelationshipWhereOperator | undefined;
        isNot: boolean;
    }) {
        super();
        this.relationship = relationship;
        this.isNot = isNot;
        this.operator = operator || "SOME";
    }

    public addFilters(filters: Filter[]): void {
        this.innerFilters.push(...filters);
    }

    public getChildren(): QueryASTNode[] {
        return [...this.innerFilters];
    }

    public print(): string {
        return `${super.print()} <${this.operator}>`;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const relatedEntity = this.relationship.target as ConcreteEntity;
        const target = new Cypher.Node({
            labels: relatedEntity.labels,
        });
        const relationship = new Cypher.Relationship({
            type: this.relationship.type,
        });

        const pattern = new Cypher.Pattern(context.target)
            .withoutLabels()
            .related(relationship)
            .withDirection(this.relationship.getCypherDirection())
            .to(target);

        const nestedContext = context.push({
            relationship,
            target,
        });

        switch (this.operator) {
            case "ALL":
                return this.getSubqueriesForOperationAll(pattern, nestedContext);
            default:
                return this.getSubqueriesForDefaultOperations(pattern, nestedContext);
        }
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (this.subqueryPredicate) return this.subqueryPredicate;
        else {
            //TODO: not concrete entities
            const relatedEntity = this.relationship.target as ConcreteEntity;
            const target = new Cypher.Node({
                labels: relatedEntity.labels,
            });
            const relationship = new Cypher.Relationship({
                type: this.relationship.type,
            });

            const pattern = new Cypher.Pattern(queryASTContext.target)
                .withoutLabels()
                .related(relationship)
                .withDirection(this.relationship.getCypherDirection())
                .to(target);

            const nestedContext = new QueryASTContext({ target, relationship, source: queryASTContext.target });

            const predicate = this.createRelationshipOperation(pattern, nestedContext);
            if (!predicate) return undefined;
            return this.wrapInNotIfNeeded(predicate);
        }
    }

    private createRelationshipOperation(
        pattern: Cypher.Pattern,
        nestedContext: QueryASTContext
    ): Cypher.Predicate | undefined {
        const connectionFilter = this.innerFilters.map((c) => c.getPredicate(nestedContext));
        const innerPredicate = Cypher.and(...connectionFilter);
        if (!innerPredicate) return undefined;

        switch (this.operator) {
            case "ALL": {
                const match = new Cypher.Match(pattern).where(innerPredicate);
                const negativeMatch = new Cypher.Match(pattern).where(Cypher.not(innerPredicate));
                // Testing "ALL" requires testing that at least one element exists and that no elements not matching the filter exists
                return Cypher.and(new Cypher.Exists(match), Cypher.not(new Cypher.Exists(negativeMatch)));
            }
            case "SINGLE": {
                return this.createSingleRelationshipOperation(pattern, nestedContext, innerPredicate);
            }
            default: {
                if (!this.relationship.isList) {
                    return this.createSingleRelationshipOperation(pattern, nestedContext, innerPredicate);
                }
                const match = new Cypher.Match(pattern).where(innerPredicate);
                return new Cypher.Exists(match);
            }
        }
    }

    private createSingleRelationshipOperation(
        pattern: Cypher.Pattern,
        context: QueryASTContext,
        innerPredicate: Cypher.Predicate
    ) {
        const patternComprehension = new Cypher.PatternComprehension(pattern, new Cypher.Literal(1)).where(
            innerPredicate
        );
        return Cypher.single(context.target, patternComprehension, new Cypher.Literal(true));
    }

    private getSubqueriesForDefaultOperations(
        pattern: Cypher.Pattern,
        queryASTContext: QueryASTContext
    ): Cypher.Clause[] {
        const match = new Cypher.Match(pattern);
        const returnVar = new Cypher.Variable();
        const innerFiltersPredicates: Cypher.Predicate[] = [];

        const subqueries = this.innerFilters.flatMap((f) => {
            const nestedSubqueries = f
                .getSubqueries(queryASTContext)
                .map((sq) => new Cypher.Call(sq).innerWith(queryASTContext.target));

            const predicate = f.getPredicate(queryASTContext);
            if (predicate) {
                innerFiltersPredicates.push(predicate);
                return nestedSubqueries;
            }

            return nestedSubqueries;
        });

        if (subqueries.length === 0) return []; // Hack logic to change predicates logic

        const comparisonValue = this.isNot ? Cypher.false : Cypher.true;
        this.subqueryPredicate = Cypher.eq(returnVar, comparisonValue);

        const countComparisonPredicate =
            this.operator === "SINGLE"
                ? Cypher.eq(Cypher.count(queryASTContext.target), new Cypher.Literal(1))
                : Cypher.gt(Cypher.count(queryASTContext.target), new Cypher.Literal(0));

        const withPredicateReturn = new Cypher.With("*")
            .where(Cypher.and(...innerFiltersPredicates))
            .return([countComparisonPredicate, returnVar]);
        return [Cypher.concat(match, ...subqueries, withPredicateReturn)];
    }

    // This method has a big deal of complexity due to a couple of factors:
    // 1. "All" operations require 2 CALL subqueries
    // 2. Each subquery has its own return variable, that needs to be carried over to the predicate
    private getSubqueriesForOperationAll(pattern: Cypher.Pattern, queryASTContext: QueryASTContext): Cypher.Clause[] {
        const match = new Cypher.Match(pattern);
        const match2 = new Cypher.Match(pattern);

        const truthyFilters: Cypher.Variable[] = [];
        const falsyFilters: Cypher.Variable[] = [];

        const subqueries = this.innerFilters.flatMap((f) => {
            const nestedSubqueries = f.getSubqueries(queryASTContext).map((sq) => {
                const predicate = f.getPredicate(queryASTContext);
                if (predicate) {
                    const returnVar = new Cypher.Variable();
                    truthyFilters.push(returnVar);
                    return new Cypher.Call(sq)
                        .innerWith(queryASTContext.target)
                        .with("*")
                        .where(predicate)
                        .return([Cypher.gt(Cypher.count(queryASTContext.target), new Cypher.Literal(0)), returnVar]);
                }
            });

            return nestedSubqueries;
        });

        if (subqueries.length === 0) return [];

        const subqueries2 = this.innerFilters.flatMap((f) => {
            const nestedSubqueries = f.getSubqueries(queryASTContext).map((sq) => {
                const predicate = f.getPredicate(queryASTContext);
                if (predicate) {
                    const returnVar = new Cypher.Variable();
                    falsyFilters.push(returnVar);
                    return new Cypher.Call(sq)
                        .innerWith(queryASTContext.target)
                        .with("*")
                        .where(Cypher.not(predicate))
                        .return([Cypher.gt(Cypher.count(queryASTContext.target), new Cypher.Literal(0)), returnVar]);
                }
            });

            return nestedSubqueries;
        });

        const falsyPredicates = falsyFilters.map((v) => Cypher.eq(v, Cypher.false));
        const truthyPredicates = truthyFilters.map((v) => Cypher.eq(v, Cypher.true));
        this.subqueryPredicate = Cypher.and(...falsyPredicates, ...truthyPredicates);

        return [Cypher.concat(match, ...subqueries), Cypher.concat(match2, ...subqueries2)];
    }

    private wrapInNotIfNeeded(predicate: Cypher.Predicate): Cypher.Predicate {
        if (this.isNot) return Cypher.not(predicate);
        else return predicate;
    }
}
