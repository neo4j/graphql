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

import type { Variable } from "../..";
import type { CypherEnvironment } from "../../Environment";
import type { Expr } from "../../types";
import { CypherFunction } from "./CypherFunction";

export function size(expr: Expr): CypherFunction {
    return new CypherFunction("size", [expr]);
}

export function collect(expr: Expr): CypherFunction {
    return new CypherFunction("collect", [expr]);
}

export function head(expr: Expr): CypherFunction {
    return new CypherFunction("head", [expr]);
}

export function last(expr: Expr): CypherFunction {
    return new CypherFunction("last", [expr]);
}

class ReducerFunction extends CypherFunction {
    private accVariable: Variable;
    private defaultValue: Expr;
    private variable: Variable;
    private listExpr: Expr;
    private mapExpr: Expr;

    constructor({
        accVariable,
        defaultValue,
        variable,
        listExpr,
        mapExpr,
    }: {
        accVariable: Variable;
        defaultValue: Expr;
        variable: Variable;
        listExpr: Expr;
        mapExpr: Expr;
    }) {
        super("reduce");
        this.accVariable = accVariable;
        this.defaultValue = defaultValue;
        this.variable = variable;
        this.listExpr = listExpr;
        this.mapExpr = mapExpr;
    }

    getCypher(env: CypherEnvironment): string {
        const accStr = `${this.accVariable.getCypher(env)} = ${this.defaultValue.getCypher(env)}`;

        const variableStr = this.variable.getCypher(env);
        const listExprStr = this.listExpr.getCypher(env);
        const mapExprStr = this.mapExpr.getCypher(env);

        return `${this.name}(${accStr}, ${variableStr} IN ${listExprStr} | ${mapExprStr})`;
    }
}

/** Reduce a list by executing given expression <https://neo4j.com/docs/cypher-manual/current/functions/list/#functions-reduce> */
export function reduce(
    accVariable: Variable,
    defaultValue: Expr,
    variable: Variable,
    listExpr: Expr,
    mapExpr: Expr
): CypherFunction {
    return new ReducerFunction({
        accVariable,
        defaultValue,
        variable,
        listExpr,
        mapExpr,
    });
}
