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

import { CypherContext } from "../CypherContext";
import { Param } from "../references/Param";

// type Params = Record<string, Param<any>>;
// type WhereInput = Array<[MatchableElement, Params] | WhereOperator>;

export const operationsMap = {
    // NOT: "=",
    // Numerical
    GT: ">",
    GTE: ">=",
    LT: "<",
    LTE: "<=",
    // Distance
    // DISTANCE: "=",
    // String
    // NOT_CONTAINS: "CONTAINS",
    CONTAINS: "CONTAINS",
    // NOT_STARTS_WITH: "STARTS WITH",
    STARTS_WITH: "STARTS WITH",
    // NOT_ENDS_WITH: "ENDS WITH",
    ENDS_WITH: "ENDS WITH",
    // Regex
    MATCHES: "=~",
    // Array
    // NOT_IN: "IN",
    IN: "IN",
    // NOT_INCLUDES: "IN",
    // INCLUDES: "IN",
};

type Operation = keyof typeof operationsMap;

export class WhereClause {
    private input: Param<any>;
    private operation: Operation;

    constructor(operation: Operation, input: Param<any>) {
        this.input = input;
        this.operation = operation;
    }

    public getCypher(context: CypherContext): string {
        const paramCypher = this.input.getCypher(context);
        const operationStr = operationsMap[this.operation];

        return `${operationStr} ${paramCypher}`;
    }
}

// Named inClause doe to in being reserved word
export function inClause(param: Param): WhereClause {
    return new WhereClause("IN", param);
}
export function gt(param: Param): WhereClause {
    return new WhereClause("GT", param);
}
export function gte(param: Param): WhereClause {
    return new WhereClause("GTE", param);
}
export function lt(param: Param): WhereClause {
    return new WhereClause("LT", param);
}
export function lte(param: Param): WhereClause {
    return new WhereClause("LTE", param);
}
export function contains(param: Param): WhereClause {
    return new WhereClause("CONTAINS", param);
}
export function startsWith(param: Param): WhereClause {
    return new WhereClause("STARTS_WITH", param);
}
export function endsWith(param: Param): WhereClause {
    return new WhereClause("ENDS_WITH", param);
}
export function match(param: Param): WhereClause {
    return new WhereClause("MATCHES", param);
}
