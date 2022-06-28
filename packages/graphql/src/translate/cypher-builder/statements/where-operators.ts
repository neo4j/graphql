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

import { RawCypher, RawCypherWithCallback, Variable } from "../CypherBuilder";
import { CypherContext } from "../CypherContext";
import { MatchableElement } from "../MatchPattern";
import { Param } from "../references/Param";
import { PredicateFunction } from "./predicate-functions";
import { ScalarFunction } from "./scalar-functions";
import { WhereInput } from "./Where";
import { WhereClause } from "./where-clauses";

type Params = Record<string, Param<any> | WhereClause>;

type Operation = "OR" | "AND" | "NOT";
// TODO: make it as an abstract class
export class WhereOperator {
    protected whereInput: WhereInput;
    protected operation: Operation;

    constructor(operation: Operation, input: WhereInput) {
        this.whereInput = input;
        this.operation = operation;
    }

    public getCypher(context: CypherContext): string {
        const nestedOperationsCypher = this.whereInput.map((input) => {
            if (input instanceof WhereOperator) return input.getCypher(context);
            if (input instanceof PredicateFunction) return input.getCypher(context);
            if (input instanceof RawCypher || input instanceof RawCypherWithCallback) return input.getCypher(context);

            return this.composeWhere(context, input as [MatchableElement | Variable, Params]);
        });

        const operationStr = `\n${this.operation} `;
        const operationsStr = nestedOperationsCypher.join(operationStr);

        if (nestedOperationsCypher.length > 1) {
            return `(${operationsStr})`;
        }

        return `${operationsStr}`;
    }

    protected composeWhere(
        context: CypherContext,
        input: [MatchableElement | Variable | ScalarFunction, Params]
    ): string {
        const [matchableElement, params] = input;

        const paramsStrs = Object.entries(params).map(([key, value]) => {
            let property: string;
            if (matchableElement instanceof ScalarFunction) {
                property = matchableElement.getCypher(context);
            } else {
                const nodeAlias = context.getVariableId(matchableElement);

                property = `${nodeAlias}.${key}`;
            }
            return this.generateWhereField({ value, property, context });
        });

        const joinedParamsStr = paramsStrs.join("\nAND ");

        if (paramsStrs.length > 1) {
            return `(${joinedParamsStr})`;
        }

        return `${joinedParamsStr}`;
    }

    protected generateWhereField({
        value,
        property,
        context,
    }: {
        value: Param<any> | WhereClause;
        property: string;
        context: CypherContext;
    }): string {
        if (value instanceof WhereClause) {
            return `${property} ${value.getCypher(context)}`;
        }

        if (value.isNull) {
            return `${property} IS ${value.getCypher(context)}`;
        }

        return `${property} = ${value.getCypher(context)}`;
    }
}

export function and(...items: WhereInput): WhereOperator {
    return new WhereOperator("AND", items);
}

export function or(...items: WhereInput): WhereOperator {
    return new WhereOperator("OR", items);
}

export function not(item: WhereInput[0]): WhereOperator {
    return new NotWhereOperator(item);
}

class NotWhereOperator extends WhereOperator {
    constructor(input: WhereInput[0]) {
        super("NOT", [input]);
    }

    public getCypher(context: CypherContext): string {
        const inputOperator = this.whereInput[0];
        if (
            inputOperator instanceof WhereOperator ||
            inputOperator instanceof PredicateFunction ||
            inputOperator instanceof RawCypher ||
            inputOperator instanceof RawCypherWithCallback
        ) {
            const composedWhere = inputOperator.getCypher(context);
            return `\n${this.operation} ${composedWhere}`;
        }

        const composedWhere = this.composeWhere(context, inputOperator);
        return `\n${this.operation} (${composedWhere})`;
    }
}
