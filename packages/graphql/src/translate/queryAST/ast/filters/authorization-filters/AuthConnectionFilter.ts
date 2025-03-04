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
