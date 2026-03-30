/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import { getEntityLabels } from "../../../utils/create-node-from-entity";
import type { QueryASTContext } from "../../QueryASTContext";
import { RelationshipFilter } from "../RelationshipFilter";

export class AuthRelationshipFilter extends RelationshipFilter {
    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (this.subqueryPredicate) {
            return this.subqueryPredicate;
        }
        const nestedContext = this.getNestedContext(queryASTContext);

        const pattern = new Cypher.Pattern(nestedContext.source as Cypher.Node)
            .related({
                type: this.relationship.type,
                direction: this.relationship.getCypherDirection(),
            })
            .to(nestedContext.target, {
                labels: getEntityLabels(this.target, queryASTContext.neo4jGraphQLContext),
            });

        const predicate = this.createRelationshipOperation(pattern, nestedContext);

        return predicate;
    }

    protected createRelationshipOperation(
        pattern: Cypher.Pattern,
        queryASTContext: QueryASTContext
    ): Cypher.Predicate | undefined {
        const predicates = this.targetNodeFilters.map((c) => c.getPredicate(queryASTContext));
        const innerPredicate = Cypher.and(...predicates);
        if (!innerPredicate) {
            return;
        }
        switch (this.operator) {
            case "ALL": {
                const match = new Cypher.Match(pattern).where(innerPredicate);
                const negativeMatch = new Cypher.Match(pattern).where(Cypher.not(innerPredicate));
                // Testing "ALL" requires testing that at least one element exists and that no elements not matching the filter exists
                return Cypher.and(new Cypher.Exists(match), Cypher.not(new Cypher.Exists(negativeMatch)));
            }
            case "SINGLE": {
                return this.getSingleRelationshipOperation({
                    pattern,
                    queryASTContext,
                    innerPredicate,
                });
            }
            case "NONE":
            case "SOME": {
                const matchClause = new Cypher.Match(pattern).where(innerPredicate);
                const existsPredicate = new Cypher.Exists(matchClause);
                return existsPredicate;
            }
        }
    }
}
