import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntity } from "../../../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../../../schema-model/relationship/Relationship";
import type { RelationshipWhereOperator } from "../../../../where/types";
import { QueryASTNode } from "../../QueryASTNode";
import type { ConnectionEdgeFilter } from "./ConnectionEdgeFilter";
import type { ConnectionNodeFilter } from "./ConnectionNodeFilter";
import { getRelationshipDirection } from "../../../utils/get-relationship-direction";

export class ConnectionFilter extends QueryASTNode {
    private targetNodeFilters: ConnectionNodeFilter[] = [];

    private relationshipFilters: ConnectionEdgeFilter[] = [];

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

    public addConnectionNodeFilter(nodeFilter: ConnectionNodeFilter): void {
        this.targetNodeFilters.push(nodeFilter);
    }

    public getPredicate(parentNode: Cypher.Variable): Cypher.Predicate | undefined {
        //TODO: not concrete entities
        const relatedEntity = this.relationship.target as ConcreteEntity;
        const relatedNode = new Cypher.Node({
            labels: relatedEntity.labels,
        });
        const relationshipVar = new Cypher.Relationship({
            type: this.relationship.type,
        });

        const pattern = new Cypher.Pattern(parentNode as Cypher.Node)
            .withoutLabels()
            .related(relationshipVar)
            .withDirection(getRelationshipDirection(this.relationship))
            .to(relatedNode);

        const predicate = this.createRelationshipOperation(pattern, relatedNode, relationshipVar);
        if (!predicate) return undefined;
        return this.wrapInNotIfNeeded(predicate);
    }

    private createRelationshipOperation(
        pattern: Cypher.Pattern,
        relatedNode: Cypher.Node,
        relationshipVar: Cypher.Relationship
    ): Cypher.Predicate | undefined {
        const predicates = this.targetNodeFilters.map((c) => c.getPredicate(relatedNode));
        const relationshipPredicates = this.relationshipFilters.map((c) => c.getPredicate(relationshipVar));
        const innerPredicate = Cypher.and(...predicates, ...relationshipPredicates);

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
                return Cypher.single(relatedNode, patternComprehension, new Cypher.Literal(true));
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
