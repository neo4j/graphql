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

import { MatchableElement, MatchParams, Pattern } from "../Pattern";
import { CypherEnvironment } from "../Environment";
import { Where, WhereParams } from "../sub-clauses/Where";
import { Clause } from "./Clause";
import { Return } from "./Return";
import { NodeRef } from "../variables/NodeRef";

export class Match<T extends MatchableElement> extends Clause {
    private pattern: Pattern<T>;
    private whereSubClause: Where | undefined;
    private returnStatement: Return | undefined;

    constructor(variable: T, parameters: MatchParams<T> = {}, parent?: Clause) {
        super(parent);
        this.pattern = new Pattern(variable).withParams(parameters);
    }

    public where(input: WhereParams): this {
        if (!this.whereSubClause) {
            const whereClause = new Where(this, input);
            this.addChildren(whereClause);
            // this.addASTNode(whereClause);
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

    public cypher(env: CypherEnvironment): string {
        const nodeCypher = this.pattern.getCypher(env);
        let whereCypher = "";
        let returnCypher = "";
        if (this.whereSubClause) {
            whereCypher = `\n${this.whereSubClause.getCypher(env)}`;
        }
        if (this.returnStatement) {
            returnCypher = `\n${this.returnStatement.getCypher(env)}`;
        }
        return `MATCH ${nodeCypher}${whereCypher}${returnCypher}`;
    }

    public return(node: NodeRef, fields?: string[], alias?: string): Return {
        const returnStatement = new Return([node, fields, alias]);
        this.addChildren(returnStatement);
        this.returnStatement = returnStatement;
        return returnStatement;
    }
}
