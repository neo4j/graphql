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
import type { FilterOperator } from "../Filter";
import { Filter } from "../Filter";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import { hasTarget } from "../../../utils/context-has-target";

export class CountFilter extends Filter {
    protected comparisonValue: unknown;
    protected operator: FilterOperator;
    protected isNot: boolean; // _NOT is deprecated

    constructor({
        isNot,
        operator,
        comparisonValue,
    }: {
        operator: FilterOperator;
        isNot: boolean;
        comparisonValue: unknown;
    }) {
        super();
        this.comparisonValue = comparisonValue;
        this.operator = operator;
        this.isNot = isNot;
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        if (!hasTarget(queryASTContext)) throw new Error("No parent node found!");
        return this.createBaseOperation({
            operator: this.operator,
            expr: Cypher.count(queryASTContext.target),
            param: new Cypher.Param(this.comparisonValue),
        });
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.isNot ? "NOT " : ""}${this.operator}>`;
    }

    /** Returns the default operation for a given filter */
    // NOTE: duplicate from property filter
    protected createBaseOperation({
        operator,
        expr,
        param,
    }: {
        operator: FilterOperator;
        expr: Cypher.Expr;
        param: Cypher.Expr;
    }): Cypher.ComparisonOp {
        switch (operator) {
            case "LT":
                return Cypher.lt(expr, param);
            case "LTE":
                return Cypher.lte(expr, param);
            case "GT":
                return Cypher.gt(expr, param);
            case "GTE":
                return Cypher.gte(expr, param);
            case "ENDS_WITH":
                return Cypher.endsWith(expr, param);
            case "STARTS_WITH":
                return Cypher.startsWith(expr, param);
            case "MATCHES":
                return Cypher.matches(expr, param);
            case "CONTAINS":
                return Cypher.contains(expr, param);
            case "IN":
                return Cypher.in(expr, param);
            case "INCLUDES":
                return Cypher.in(param, expr);
            case "EQ":
                return Cypher.eq(expr, param);
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }
}
