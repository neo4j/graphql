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
import { MatchableElement } from "../MatchPattern";
import { Param } from "../references/Param";

// type Params = Record<string, Param<any>>;
// type WhereInput = Array<[MatchableElement, Params] | WhereOperator>;

type Operation = "IN";

export class WhereClause {
    private input: Param<any>;
    private operation: Operation;

    constructor(operation: Operation, input: Param<any>) {
        this.input = input;
        this.operation = operation;
    }

    public getCypher(context: CypherContext): string {
        const paramCypher = this.input.getCypher(context);
        const operationStr = this.operation;

        return `${operationStr} ${paramCypher}`;
    }
}

export function inClause(param: Param): WhereClause {
    return new WhereClause("IN", param);
}
