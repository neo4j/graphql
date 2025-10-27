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
    }

    public getChildren() {
        return [];
    }

    // Should this be subquery maybe? (apoc.validate)
    public getPredicate(_queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        return undefined;
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
