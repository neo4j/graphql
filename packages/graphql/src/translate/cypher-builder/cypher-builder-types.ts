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

export type CypherResult = {
    cypher: string;
    params: Record<string, string>;
};

export abstract class CypherASTNode {
    protected children: Array<CypherASTNode> = [];
    protected parent?: CypherASTNode;

    constructor(parent?: CypherASTNode) {
        this.parent = parent;
    }

    protected addStatement<C extends CypherASTNode>(astNode: C): C {
        this.children.push(astNode);
        return astNode;
    }

    public getRoot(): CypherASTNode {
        if (this.parent) {
            return this.parent.getRoot();
        }
        return this;
    }

    public getCypher(context: CypherContext, separator = "\n"): string {
        return this.children
            .map((value) => {
                return value.getCypher(context);
            })
            .join(separator);
    }

    public build(prefix?: string): CypherResult {
        if (this.isRoot) {
            const context = this.getContext(prefix);
            const cypher = this.getCypher(context);
            return {
                cypher,
                params: context.getParams(),
            };
        }
        const root = this.getRoot();
        return root.build(prefix);
    }

    protected getContext(prefix?: string): CypherContext {
        return new CypherContext(prefix);
    }

    private get isRoot() {
        return this.parent === undefined;
    }
}
