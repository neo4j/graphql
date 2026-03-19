/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../../QueryASTContext";
import { ConnectionFilter } from "../ConnectionFilter";

export class AuthConnectionFilter extends ConnectionFilter {
    protected createRelationshipOperation(
        pattern: Cypher.Pattern,
        queryASTContext: QueryASTContext
    ): Cypher.Predicate | undefined {
        const connectionFilter = this.innerFilters.map((c) => c.getPredicate(queryASTContext));
        const labelPredicate = this.getLabelPredicate(queryASTContext);
        const innerPredicate = Cypher.and(...connectionFilter, labelPredicate);
        const useExist = queryASTContext.neo4jGraphQLContext.neo4jDatabaseInfo?.gte("5.0");

        if (!innerPredicate) return undefined;

        switch (this.operator) {
            case "ALL": {
                if (!useExist) {
                    const patternComprehension = new Cypher.PatternComprehension(pattern).map(new Cypher.Literal(1));
                    const sizeFunction = Cypher.size(patternComprehension.where(Cypher.not(innerPredicate)));
                    return Cypher.eq(sizeFunction, new Cypher.Literal(0));
                }
                const match = new Cypher.Match(pattern).where(innerPredicate);
                const negativeMatch = new Cypher.Match(pattern).where(Cypher.not(innerPredicate));
                // Testing "ALL" requires testing that at least one element exists and that no elements not matching the filter exists
                return Cypher.and(new Cypher.Exists(match), Cypher.not(new Cypher.Exists(negativeMatch)));
            }
            case "SINGLE": {
                return this.createSingleRelationshipOperation(pattern, queryASTContext, innerPredicate);
            }
            default: {
                if (!this.relationship.isList) {
                    return this.createSingleRelationshipOperation(pattern, queryASTContext, innerPredicate);
                }
                if (!useExist) {
                    const patternComprehension = new Cypher.PatternComprehension(pattern).map(new Cypher.Literal(1));
                    const sizeFunction = Cypher.size(patternComprehension.where(innerPredicate));
                    return Cypher.gt(sizeFunction, new Cypher.Literal(0));
                }

                const match = new Cypher.Match(pattern).where(innerPredicate);
                return new Cypher.Exists(match);
            }
        }
    }
}
