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
import type { QueryASTNode } from "../../QueryASTNode";
import { Filter } from "../Filter";

/** A property which comparison has already been parsed into a Param */
export class FulltextScoreFilter extends Filter {
    private scoreVariable: Cypher.Variable;
    private min?: number;
    private max?: number;

    constructor({ scoreVariable, min, max }: { scoreVariable: Cypher.Variable; min?: number; max?: number }) {
        super();
        this.scoreVariable = scoreVariable;
        this.min = min;
        this.max = max;
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    // constructor(options: {
    //     attribute: AttributeAdapter;
    //     comparisonValue: CypherVariable;
    //     operator: FilterOperator;
    //     isNot: boolean;
    //     attachedTo?: "node" | "relationship";
    // }) {
    //     super(options);
    //     this.comparisonValue = options.comparisonValue;
    // }

    public getPredicate(_queryASTContext: QueryASTContext): Cypher.Predicate {
        const predicates: Cypher.Predicate[] = [];

        if (this.max || this.max === 0) {
            const maxPredicate = Cypher.lte(this.scoreVariable, new Cypher.Param(this.max));
            predicates.push(maxPredicate);
        }
        if (this.min || this.min === 0) {
            const minPredicate = Cypher.gte(this.scoreVariable, new Cypher.Param(this.min));
            predicates.push(minPredicate);
        }

        return Cypher.and(...predicates);

        // const predicate = super.getPredicate(queryASTContext);

        // // NOTE: Should this check be a different Filter?
        // return Cypher.and(Cypher.isNotNull(this.comparisonValue), predicate);
    }

    // protected getOperation(): Cypher.ComparisonOp {
    // const comparisonParam = new Cypher.Param(this.comparisonValue);
    // return createComparisonOperation({
    //     operator: this.operator,
    //     property: this.score,
    //     param: comparisonParam,
    // });
    // if (whereInput?.[SCORE_FIELD]) {
    //     if (whereInput[SCORE_FIELD].min || whereInput[SCORE_FIELD].min === 0) {
    //         const scoreMinOp = Cypher.gte(scoreVar, new Cypher.Param(whereInput[SCORE_FIELD].min));
    //         if (scoreMinOp) whereOperators.push(scoreMinOp);
    //     }
    //     if (whereInput[SCORE_FIELD].max || whereInput[SCORE_FIELD].max === 0) {
    //         const scoreMaxOp = Cypher.lte(scoreVar, new Cypher.Param(whereInput[SCORE_FIELD].max));
    //         if (scoreMaxOp) whereOperators.push(scoreMaxOp);
    //     }
    // }
}

/** Returns the default operation for a given filter */
// protected createBaseOperation({
//     operator,
//     property,
//     param,
// }: {
//     operator: FilterOperator;
//     property: Cypher.Expr;
//     param: Cypher.Expr;
// }): Cypher.ComparisonOp {

//     return createComparisonOperation({ operator, property: coalesceProperty, param });
// }
