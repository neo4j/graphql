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
import { type QueryASTContext } from "../../QueryASTContext";
import { ParamInputField } from "../ParamInputField";

type MathOperator = "increment" | "decrement" | "add" | "subtract" | "divide" | "multiply";

export class MathInputField extends ParamInputField {
    private operation: MathOperator;

    constructor({
        attribute,
        attachedTo,
        inputValue,
        operation,
    }: {
        attribute: AttributeAdapter;
        attachedTo: "node" | "relationship";
        inputValue: unknown;
        operation: MathOperator;
    }) {
        super({ attribute, attachedTo, inputValue });
        this.operation = operation;
        if (operation == "divide" && inputValue === 0) {
            throw new Error("Division by zero is not supported");
        }
    }

    public getChildren() {
        return [];
    }

    public getSubqueries(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.Clause[] {
        const prop = this.getLeftExpression(queryASTContext);

        const bitSize = this.attribute.typeHelper.isInt() ? 32 : 64;
        const rightExpr = this.getRightExpression(queryASTContext);
        // Avoid overflows, for 64 bit overflows, a long overflow is raised anyway by Neo4j

        const maxBit = Cypher.minus(
            Cypher.pow(new Cypher.Literal(2), new Cypher.Literal(bitSize - 1)),
            new Cypher.Literal(1)
        );

        return [
            Cypher.utils.concat(
                Cypher.apoc.util.validate(
                    Cypher.isNull(prop),
                    "Cannot %s %s to Nan",
                    new Cypher.List([new Cypher.Literal(this.operation), this.getParam()])
                ),
                Cypher.apoc.util.validate(
                    Cypher.gt(rightExpr, maxBit),
                    "Overflow: Value returned from operator %s is larger than %s bit",
                    new Cypher.List([new Cypher.Literal(this.operation), new Cypher.Literal(bitSize)])
                )
            ),
        ];
    }

    protected getRightExpression(
        queryASTContext: QueryASTContext<Cypher.Node>
    ): Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection> {
        const rightVariable = super.getRightExpression(queryASTContext);
        const targetProperty = this.getLeftExpression(queryASTContext);

        switch (this.operation) {
            case "add":
            case "increment":
                return Cypher.plus(targetProperty, rightVariable);
            case "decrement":
            case "subtract":
                return Cypher.minus(targetProperty, rightVariable);
            case "divide":
                return Cypher.divide(targetProperty, rightVariable);
            case "multiply":
                return Cypher.multiply(targetProperty, rightVariable);

            default:
                throw new Error(`Unknown operation ${this.operation}`);
        }
    }
}
