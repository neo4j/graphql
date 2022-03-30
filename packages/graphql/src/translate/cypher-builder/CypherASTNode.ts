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

import { CypherContext } from "./CypherContext";
import { Param } from "./references/Param";

/** Abstract class representing a Cypher Statement in the AST */
export abstract class CypherASTNode {
    protected children: Array<CypherASTNode> = [];
    protected parent?: CypherASTNode;
    protected namedParams: Record<string, Param> = {}; // Only for compatibility reasons

    constructor(parent?: CypherASTNode) {
        this.parent = parent;
    }

    public getRoot(): CypherASTNode {
        if (this.parent) {
            return this.parent.getRoot();
        }
        return this;
    }

    /** Visitor pattern to generate the Cypher on nested nodes */
    public getCypher(context: CypherContext, separator = "\n"): string {
        Object.entries(this.namedParams).forEach(([name, param]) => {
            context.addNamedParamReference(name, param); // Only for compatibility reasons
        });

        const childrenCypher = this.children.map((value) => value.getCypher(context)).join(separator);
        return this.cypher(context, childrenCypher);
    }

    /** Defines the internal Cypher to generate by the ASTNode */
    protected abstract cypher(context: CypherContext, childrenCypher: string): string;

    protected getContext(prefix?: string): CypherContext {
        return new CypherContext(prefix);
    }

    protected addStatement<C extends CypherASTNode>(astNode: C): C {
        this.children.push(astNode);
        return astNode;
    }

    public addNamedParams(params: Record<string, Param>) {
        this.namedParams = { ...this.namedParams, ...params };
    }

    protected get isRoot() {
        return this.parent === undefined;
    }
}
