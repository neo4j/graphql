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
import { MatchableElement, MatchPattern } from "../MatchPattern";
import { Param } from "../references/Param";
import { Query } from "./Query";
import { ReturnStatement, ReturnStatementArgs } from "./Return";

type Params = Record<string, Param<any>>;

type Where = Map<MatchableElement, Params>;

export class Match extends Query {
    private matchPattern: MatchPattern;
    private whereParams: Where;

    constructor(variable: MatchableElement, parent?: Query) {
        super(parent);
        this.matchPattern = new MatchPattern(variable);
        this.whereParams = new Map<MatchableElement, Params>();
    }

    // TODO: public where(params: Params): Match {
    public where(variable: MatchableElement, params: Params): Match {
        const oldParams = this.whereParams.get(variable) || {};

        this.whereParams.set(variable, { ...oldParams, ...params });
        return this;
    }

    public cypher(context: CypherContext, childrenCypher: string): string {
        const nodeCypher = this.matchPattern.getCypher(context);
        return `MATCH ${nodeCypher}\n${this.composeWhere(context)}\n${childrenCypher}`;
    }

    public return(...args: ReturnStatementArgs) {
        const returnStatement = new ReturnStatement(this, args);
        this.addStatement(returnStatement);
        return this;
    }

    public and(variable: MatchableElement, params: Params): Match {
        return this.where(variable, params);
    }

    private composeWhere(context: CypherContext): string {
        const whereStatements: string[][] = [];
        this.whereParams.forEach((params, variable) => {
            const nodeAlias = context.getVariableId(variable);
            const paramsStrs = Object.entries(params).map(([key, value]) => {
                return `${nodeAlias}.${key} = ${value instanceof Param ? value.getCypher(context) : value}`;
            });
            whereStatements.push(paramsStrs);
        });

        const whereParams = whereStatements.flat();

        if (whereParams.length === 0) return "";
        return `WHERE ${whereParams.join("\nAND")}`;
    }
}
