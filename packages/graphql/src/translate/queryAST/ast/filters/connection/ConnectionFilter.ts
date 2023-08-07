import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntity } from "../../../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../../../schema-model/relationship/Relationship";
import type { RelationshipWhereOperator } from "../../../../where/types";
import { getRelationshipDirection } from "../../../utils/get-relationship-direction";
import { Filter } from "../Filter";
import { QueryASTContext } from "../../QueryASTContext";

export class ConnectionFilter extends Filter {
    private innerFilters: Filter[] = [];
    private relationship: Relationship;
    private operator: RelationshipWhereOperator;
    private isNot: boolean;

    constructor({
        relationship,
        operator,
        isNot,
    }: {
        relationship: Relationship;
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

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
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
            .withDirection(getRelationshipDirection(this.relationship))
            .to(target);

        const nestedContext = new QueryASTContext({target, relationship, source: queryASTContext.target, })
       
        const predicate = this.createRelationshipOperation(pattern, nestedContext);
        if (!predicate) return undefined;
        return this.wrapInNotIfNeeded(predicate);
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
                const patternComprehension = new Cypher.PatternComprehension(pattern, new Cypher.Literal(1)).where(
                    innerPredicate
                );
                return Cypher.single(nestedContext.target, patternComprehension, new Cypher.Literal(true));
                // const isArray = relationField.typeMeta.array;
                // const isRequired = relationField.typeMeta.required;

                // if (isArray || !isRequired) {
                //     const patternComprehension = new Cypher.PatternComprehension(
                //         matchPattern,
                //         new Cypher.Literal(1)
                //     ).where(innerOperation);
                //     return { predicate: Cypher.single(childNode, patternComprehension, new Cypher.Literal(true)) };
                // }

                // const matchStatement = new Cypher.Match(matchPattern);
                // return {
                //     predicate: innerOperation,
                //     preComputedSubqueries: Cypher.concat(matchStatement),
                // };
            }
            default: {
                const match = new Cypher.Match(pattern).where(innerPredicate);
                return new Cypher.Exists(match);
            }
        }
    }

    private wrapInNotIfNeeded(predicate: Cypher.Predicate): Cypher.Predicate {
        if (this.isNot) return Cypher.not(predicate);
        else return predicate;
    }
}
