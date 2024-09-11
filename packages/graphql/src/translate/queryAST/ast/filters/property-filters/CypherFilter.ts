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
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { createComparisonOperation } from "../../../utils/create-comparison-operator";
import { createPointOperation } from "../../../utils/create-point-operation";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { CustomCypherSelection } from "../../selection/CustomCypherSelection";
import type { FilterOperator } from "../Filter";
import { Filter } from "../Filter";

/** A property which comparison has already been parsed into a Param */
export class CypherFilter extends Filter {
    private returnVariable: Cypher.Variable = new Cypher.Variable();
    private attribute: AttributeAdapter;
    private selection: CustomCypherSelection;
    private operator: FilterOperator;
    protected comparisonValue: unknown;

    constructor({
        selection,
        attribute,
        operator,
        comparisonValue,
    }: {
        selection: CustomCypherSelection;
        attribute: AttributeAdapter;
        operator: FilterOperator;
        comparisonValue: unknown;
    }) {
        super();
        this.selection = selection;
        this.attribute = attribute;
        this.operator = operator;
        this.comparisonValue = comparisonValue;
    }

    public getChildren(): QueryASTNode[] {
        return [this.selection];
    }

    public print(): string {
        return `${super.print()} [${this.attribute.name}] <${this.operator}>`;
    }

    public getSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const { selection: cypherSubquery, nestedContext } = this.selection.apply(context);

        const clause = Cypher.concat(
            cypherSubquery,
            new Cypher.Return([nestedContext.returnVariable, this.returnVariable])
        );

        return [clause];
    }

    public getPredicate(_queryASTContext: QueryASTContext): Cypher.Predicate {
        const operation = this.createBaseOperation({
            operator: this.operator,
            property: this.returnVariable,
            param: new Cypher.Param(this.comparisonValue),
        });

        return operation;
    }

    private coalesceValueIfNeeded(expr: Cypher.Expr): Cypher.Expr {
        if (this.attribute.annotations.coalesce) {
            const value = this.attribute.annotations.coalesce.value;
            const literal = new Cypher.Literal(value);
            return Cypher.coalesce(expr, literal);
        }
        return expr;
    }

    /** Returns the default operation for a given filter */
    private createBaseOperation({
        operator,
        property,
        param,
    }: {
        operator: FilterOperator;
        property: Cypher.Expr;
        param: Cypher.Expr;
    }): Cypher.ComparisonOp {
        const coalesceProperty = this.coalesceValueIfNeeded(property);

        if (operator === "DISTANCE") {
            return createPointOperation({
                operator,
                property: coalesceProperty,
                param: new Cypher.Param(this.comparisonValue),
                attribute: this.attribute,
            });
        }

        return createComparisonOperation({ operator, property: coalesceProperty, param });
    }
}
