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

import { CypherContext } from "../../cypher-builder/CypherContext";
import { MatchableElement, MatchParams, MatchPattern } from "../../cypher-builder/MatchPattern";
import { Where, WhereParams } from "../sub-clauses/Where";
import { Clause } from "./Clause";

export class Match<T extends MatchableElement> extends Clause {
    private matchPattern: MatchPattern<T>;
    private whereSubClause: Where | undefined;

    constructor(variable: T, parameters: MatchParams<T> = {}, parent?: Clause) {
        super(parent);
        this.matchPattern = new MatchPattern(variable).withParams(parameters);
    }

    public where(input: WhereParams): this {
        if (!this.whereSubClause) {
            const whereClause = new Where(this, input);
            this.addASTNode(whereClause);
            this.whereSubClause = whereClause;
        } else {
            this.and(input);
        }
        return this;
    }

    public and(input: WhereParams): this {
        if (!this.whereSubClause) throw new Error("Cannot and without a where");
        this.whereSubClause.and(input);
        return this;
    }

    public cypher(context: CypherContext, childrenCypher: string): string {
        const nodeCypher = this.matchPattern.getCypher(context);
        return `MATCH ${nodeCypher}\n${childrenCypher}`;
    }

    // public return(node: Node, fields?: string[], alias?: string): this {
    //     const returnStatement = new ReturnStatement(this, [node, fields, alias]);
    //     this.addStatement(returnStatement);
    //     return this;
    // }
}
