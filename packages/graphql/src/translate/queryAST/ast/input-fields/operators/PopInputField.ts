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

export class PopInputField extends ParamInputField {
    constructor({
        attribute,
        attachedTo,
        inputValue,
    }: {
        attribute: AttributeAdapter;
        attachedTo: "node" | "relationship";
        inputValue: unknown;
    }) {
        super({ attribute, attachedTo, inputValue });
    }

    public getPredicate(queryASTContext: QueryASTContext<Cypher.Node>): Cypher.Predicate | undefined {
        const expr = this.getLeftExpression(queryASTContext);
        return Cypher.apoc.util.validatePredicate(
            Cypher.isNull(expr),
            `Property ${this.attribute.name} cannot be NULL`
        );
    }

    protected getRightExpression(
        queryASTContext: QueryASTContext<Cypher.Node>
    ): Exclude<Cypher.Expr, Cypher.Map | Cypher.MapProjection> {
        const rightVariable = super.getParam();
        const rightExpr = Cypher.minus(rightVariable);
        const leftExpr = this.getLeftExpression(queryASTContext);
        return new Cypher.Raw((context) => {
            const leftExprCompiled = context.compile(leftExpr);
            const poppedValueCompiled = context.compile(rightExpr);
            return `${leftExprCompiled}[0..${poppedValueCompiled}]`;
        });
    }
}
