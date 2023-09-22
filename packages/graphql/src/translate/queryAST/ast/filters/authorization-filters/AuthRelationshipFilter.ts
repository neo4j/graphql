/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Cypher from "@neo4j/cypher-builder";
import type { QueryASTContext } from "../../QueryASTContext";
import { RelationshipFilter } from "../RelationshipFilter";

export class AuthRelationshipFilter extends RelationshipFilter {
    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (this.subqueryPredicate) return this.subqueryPredicate;
        const nestedContext = this.getNestedContext(queryASTContext);

        if (this.shouldCreateOptionalMatch()) {
            const predicates = this.targetNodeFilters.map((c) => c.getPredicate(nestedContext));
            const innerPredicate = Cypher.and(...predicates);
            return Cypher.and(Cypher.neq(this.countVariable, new Cypher.Literal(0)), innerPredicate);
        }

        const pattern = new Cypher.Pattern(nestedContext.source as Cypher.Node)
            .withoutLabels()
            .related(nestedContext.relationship)
            .withDirection(this.relationship.getCypherDirection())
            .withoutVariable()
            .to(nestedContext.target);

        const predicate = this.createRelationshipOperation(pattern, nestedContext);
        if (!predicate) return undefined;
        return this.wrapInNotIfNeeded(predicate);
    }

    protected createRelationshipOperation(
        pattern: Cypher.Pattern,
        queryASTContext: QueryASTContext
    ): Cypher.Predicate | undefined {
        const predicates = this.targetNodeFilters.map((c) => c.getPredicate(queryASTContext));
        const innerPredicate = Cypher.and(...predicates);

        switch (this.operator) {
            case "ALL": {
                if (!innerPredicate) return undefined;
                const match = new Cypher.Match(pattern).where(innerPredicate);
                const negativeMatch = new Cypher.Match(pattern).where(Cypher.not(innerPredicate));
                // Testing "ALL" requires testing that at least one element exists and that no elements not matching the filter exists
                return Cypher.and(new Cypher.Exists(match), Cypher.not(new Cypher.Exists(negativeMatch)));
            }
            case "SINGLE": {
                if (!innerPredicate) return undefined;

                return this.getSingleRelationshipOperation({
                    pattern,
                    queryASTContext,
                    innerPredicate,
                });
            }
            case "NONE":
            case "SOME": {
                if (!this.relationship.isList) {
                    if (this.relationship.isNullable) {
                        if (!innerPredicate) return undefined;

                        return this.getSingleRelationshipOperation({
                            pattern,
                            queryASTContext,
                            innerPredicate,
                        });
                    } else {
                        // Optional Match + Count
                    }
                }

                const patternComprehension = new Cypher.PatternComprehension(pattern, new Cypher.Literal(1));
                if (innerPredicate) {
                    patternComprehension.where(innerPredicate);
                }
                return Cypher.gt(Cypher.size(patternComprehension), new Cypher.Literal(0));
            }
        }
    }
}
