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
import { MatchPattern } from "../MatchPattern";
import { Node } from "../references/Node";
import { Param } from "../references/Param";
import { Query } from "./Query";
import { ReturnStatement, ReturnStatementArgs } from "./Return";

type Params = Record<string, Param<any>>;

export class Create extends Query {
    private matchPattern: MatchPattern<Node>;
    private setParams: Params;

    constructor(private node: Node, params: Params = {}, parent?: Query) {
        super(parent);
        this.matchPattern = new MatchPattern(node).withParams(params);
        this.setParams = {};
    }

    public set(params: Params): this {
        this.setParams = params;
        return this;
    }

    public cypher(context: CypherContext, childrenCypher: string): string {
        const nodeCypher = this.matchPattern.getCypher(context);
        return `CREATE ${nodeCypher}\n${this.composeSet(context)}\n${childrenCypher}`;
    }

    public return(...args: ReturnStatementArgs) {
        const returnStatement = new ReturnStatement(this, args);
        this.addStatement(returnStatement);
        return this;
    }

    private composeSet(context: CypherContext): string {
        const nodeAlias = context.getVariableId(this.node);
        const setParams = Object.entries(this.setParams).map(([key, value]) => {
            return `${nodeAlias}.${key} = ${value instanceof Param ? value.getCypher(context) : value}`;
        });
        if (setParams.length === 0) return "";
        return `SET ${setParams.join(",\n")}`;
    }
}
