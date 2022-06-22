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
import { MatchableElement, MatchParams, MatchPattern } from "../MatchPattern";
import { Node } from "../references/Node";
import { Param } from "../references/Param";
import { Query } from "./Query";
import { ReturnStatement } from "./Return";
import { WhereClause } from "./where-clauses";
import { and, WhereOperator } from "./where-operators";
import { PredicateFunction } from "./predicate-functions";

type Params = Record<string, Param<any> | WhereClause>;

type WhereInput = Array<[MatchableElement, Params] | WhereOperator | PredicateFunction>;

export class Match<T extends MatchableElement> extends Query {
    private matchPattern: MatchPattern<T>;
    private whereParams: Array<WhereOperator>;

    constructor(variable: T, parameters: MatchParams<T> = {}, parent?: Query) {
        super(parent);
        this.matchPattern = new MatchPattern(variable).withParams(parameters);
        this.whereParams = [];
    }

    public where(...input: WhereInput): this {
        for (const operation of input) {
            if (operation instanceof WhereOperator) {
                this.whereParams.push(operation);
            } else {
                const formattedOperation = and(operation);
                this.whereParams.push(formattedOperation);
            }
        }
        return this;
    }

    public cypher(context: CypherContext, childrenCypher: string): string {
        const nodeCypher = this.matchPattern.getCypher(context);
        return `MATCH ${nodeCypher}\n${this.composeWhere(context)}\n${childrenCypher}`;
    }

    public return(node: Node, fields?: string[], alias?: string): this {
        const returnStatement = new ReturnStatement(this, [node, fields, alias]);
        this.addStatement(returnStatement);
        return this;
    }

    private composeWhere(context: CypherContext): string {
        const whereStatements = this.whereParams.map((operation) => {
            return operation.getCypher(context);
        });

        if (whereStatements.length === 0) return "";
        if (whereStatements.length > 1) return `WHERE (${whereStatements.join("\nAND ")})`;
        return `WHERE ${whereStatements.join("\nAND ")}`;
    }
}
