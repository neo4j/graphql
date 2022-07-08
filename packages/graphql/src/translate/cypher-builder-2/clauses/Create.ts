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

import { Pattern } from "../Pattern";
import { PropertyRef } from "../PropertyRef";
import { SetClause } from "../sub-clauses/Set";
import { Clause } from "./Clause";
import { Return } from "./Return";
import type { CypherEnvironment } from "../Environment";
import type { NodeRef } from "../variables/NodeRef";
import type { Param } from "../variables/Param";

type CreateSetParams = [PropertyRef | string, Param<any>];

type Params = Record<string, Param<any>>;

export class Create extends Clause {
    private node: NodeRef;
    private pattern: Pattern<NodeRef>;
    private setClause: SetClause;
    private returnStatement: Return | undefined;

    constructor(node: NodeRef, params: Params = {}, parent?: Clause) {
        super(parent);
        this.pattern = new Pattern(node).withParams(params);
        this.addChildren(this.pattern);
        this.setClause = new SetClause(this);
        this.node = node;
    }

    public set(...params: CreateSetParams[]): this {
        const formattedParams: Array<[PropertyRef, Param<any>]> = params.map(([prop, param]) => {
            if (typeof prop === "string") {
                const property = new PropertyRef(this.node, prop);
                return [property, param];
            }
            return [prop, param];
        });
        this.setClause.addParams(...formattedParams);
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
