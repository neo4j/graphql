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

import { NestedRecord } from "src/types";
import { Node, Param } from "./cypher-builder-references";
import { CypherASTNode, CypherASTRoot } from "./cypher-builder-types";

export { Node, Param } from "./cypher-builder-references";

// abstract class CypherASTNode implements CypherStatement {
//     protected parent?: CypherASTNode;
//     protected children: Array<CypherASTNode> = [];
//
//     protected addStatement<C extends CypherASTNode>(astNode: C): C {
//         this.children.push(astNode);
//         astNode.parent = this;
//         return astNode;
//     }
//
//     public abstract getCypher(): string;
//     // Recursively composes the AST tree for cypher
//     // public getCypher(): string {
//     //     const root = this.getRoot();
//     //     return root.getCypher();
//     // }
//
//     protected getRoot(): CypherASTNode {
//         if (this.parent) return this.parent.getRoot();
//         else return this;
//     }
//
//     public composeCypher(unionStr = "\n"): string {
//         return this.children.map((c) => c.composeCypher()).join(unionStr);
//     }
//
//     public abstract getParams(): NestedRecord<string>;
// }

type Params = Record<string, string | Param>;

export class Query extends CypherASTRoot {
    // protected children: Array<CreateStatement | CypherASTNode> = [];

    public create(node: Node, params: Params): CreateStatement {
        return this.addStatement(new CreateStatement(node, params));
    }

    // public call(query: ReturnStatement) {
    //     this.addStatement(new CallStatement(query));
    //     return this;
    // }

    public return(...args: ReturnStatementArgs) {
        this.addStatement(new ReturnStatement(args));
        return this;
    }

    public getParams(): NestedRecord<string> {
        throw new Error("Method not implemented.");
    }
}
//
// class CallStatement extends CypherASTNode {
//     private query: CypherASTNode;
//     constructor(query: CypherASTNode) {
//         super();
//         this.query = query;
//     }
//
//     public composeCypher(): string {
//         return `CALL { ${this.query.getCypher()} }`;
//     }
//     public getParams(): NestedRecord<string> {
//         throw new Error("Method not implemented.");
//     }
// }
//
class CreateStatement extends CypherASTNode {
    protected children: Array<ReturnStatement> = [];
    constructor(private node: Node, private params: Params) {
        super();
    }

    public getParams(): NestedRecord<string> {
        throw new Error("Method not implemented.");
    }
    public composeCypher(): string {
        // TODO: throw if return not last
        return `CREATE ${this.node.getCypher()}\n${this.composeSet()}\n${super.composeCypher("\n")}`;
    }

    private composeSet(): string {
        const nodeAlias = this.node.alias!;
        const params = Object.entries(this.params).map(([key, value]) => {
            return `${nodeAlias}.${key} = ${value instanceof Param ? value.id : value}`;
        });
        if (params.length === 0) return "";
        else return `SET ${params.join(",\n")}`;
    }

    public return(...args: ReturnStatementArgs) {
        return this.addStatement(new ReturnStatement(args));
    }
}

type ReturnStatementArgs = [Node, Array<string>?, string?];

class ReturnStatement extends CypherASTNode {
    private returnArgs: ReturnStatementArgs;

    constructor(args: ReturnStatementArgs) {
        super();
        this.returnArgs = args;
    }

    public getParams(): NestedRecord<string> {
        throw new Error("Method not implemented.");
    }
    public composeCypher(): string {
        let projection = "";
        let alias = "";
        if ((this.returnArgs[1] || []).length > 0) {
            projection = ` {${(this.returnArgs[1] as Array<string>).map((s) => `"${s}"`).join(", ")}}`;
        }

        if ((this.returnArgs[2] || []).length > 0) {
            alias = ` AS ${this.returnArgs[2]}`;
        }
        return `RETURN ${this.returnArgs[0].alias}${projection}${alias}`;
    }
}
