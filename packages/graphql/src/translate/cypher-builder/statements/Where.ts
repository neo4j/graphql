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

import { CypherASTNode } from "../CypherASTNode";
import { Param } from "../CypherBuilder";
import { CypherContext } from "../CypherContext";
import { MatchableElement } from "../MatchPattern";
import { PredicateFunction } from "./predicate-functions";
import { WhereClause } from "./where-clauses";
import { WhereOperator, and } from "./where-operators";

type Params = Record<string, Param<any> | WhereClause>;
export type WhereInput = Array<[MatchableElement, Params] | WhereOperator | PredicateFunction>;

export class WhereStatement extends CypherASTNode {
    private whereParams: Array<WhereOperator>;
    protected whereClause = "WHERE";

    constructor(parent: CypherASTNode, whereInput: WhereInput) {
        super(parent);
        this.whereParams = [];
        this.addWhereParams(whereInput);
    }

    public addWhereParams(input: WhereInput): this {
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

    public cypher(context: CypherContext): string {
        const whereStatements = this.whereParams.map((operation) => {
            return operation.getCypher(context);
        });

        if (whereStatements.length === 0) return "";
        if (whereStatements.length > 1) return `${this.whereClause} (${whereStatements.join("\nAND ")})`;
        return `${this.whereClause} ${whereStatements.join("\nAND ")}`;
    }
}

export class InnerWhereStatement extends WhereStatement {
    constructor(parent: CypherASTNode, whereInput: WhereInput) {
        super(parent, whereInput);
        this.whereClause = "INNER WHERE";
    }
}
