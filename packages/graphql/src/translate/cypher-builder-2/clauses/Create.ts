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

import { CypherEnvironment } from "../Environment";
import { Pattern } from "../Pattern";
import { SetClause, SetParam } from "../sub-clauses/Set";
import { NodeRef } from "../variables/NodeRef";
import { Param } from "../variables/Param";
import { Clause } from "./Clause";
import { Return } from "./Return";

type Params = Record<string, Param<any>>;

export class Create extends Clause {
    private pattern: Pattern<NodeRef>;
    private setClause: SetClause;
    private returnStatement: Return | undefined;

    constructor(node: NodeRef, params: Params = {}, parent?: Clause) {
        super(parent);
        this.pattern = new Pattern(node).withParams(params);
        this.setClause = new SetClause(this);
    }

    public set(...params: SetParam[]): this {
        this.setClause.addParams(...params);
        return this;
    }

    public cypher(env: CypherEnvironment): string {
        const nodeCypher = this.pattern.getCypher(env);
        let setStr = this.setClause.getCypher(env);
        if (setStr) setStr = `\n${setStr}`; // TODO: improve this
        const returnStr = this.returnStatement ? `\n${this.returnStatement.getCypher(env)}` : "";
        return `CREATE ${nodeCypher}${setStr}${returnStr}`;
    }

    public return(node: NodeRef, fields?: string[], alias?: string): Return {
        const returnStatement = new Return([node, fields, alias]);
        this.addChildren(returnStatement);
        this.returnStatement = returnStatement;
        return returnStatement;
    }
}
