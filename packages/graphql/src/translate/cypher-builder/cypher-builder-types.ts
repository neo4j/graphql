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

export abstract class CypherASTElement {
    protected children: Array<CypherASTNode> = [];
}

export abstract class CypherASTRoot extends CypherASTElement {
    protected addStatement<C extends CypherASTNode>(astNode: C): C {
        this.children.push(astNode);
        return astNode;
    }

    public getRoot(): CypherASTRoot {
        return this;
    }

    public build(prefix?: string): CypherResult {
        const context = this.getContext(prefix);
        const cypher = this.getCypher(context);
        return {
            cypher: cypher,
            params: context.getParams(),
        };
    }

    public getCypher(context: CypherContext, separator = "\n"): string {
        const result = this.children
            .map((value) => {
                return value.getCypher(context);
            })
            .join(separator);
        return result;
    }

    protected getContext(prefix?: string): CypherContext {
        return new CypherContext(prefix);
    }
}

export abstract class CypherASTNode extends CypherASTElement {
    protected parent: CypherASTNode | CypherASTRoot;

    constructor(parent: CypherASTNode | CypherASTRoot) {
        super();
        this.parent = parent;
    }

    protected addStatement<C extends CypherASTNode>(astNode: C): C {
        this.children.push(astNode);
        astNode.parent = this;
        return astNode;
    }

    public getCypher(context: CypherContext, separator = "\n"): string {
        return this.children
            .map((value) => {
                return value.getCypher(context);
            })
            .join(separator);
    }

    public build(prefix?: string): CypherResult {
        const root = this.getRoot();
        return root.build(prefix);
    }

    public getRoot(): CypherASTRoot {
        return this.parent.getRoot();
    }
}
