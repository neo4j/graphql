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

import type { CypherEnvironment } from "./Environment";
import type { CypherCompilable } from "./types";

/** Abstract class representing a Cypher Statement in the AST
 * @hidden
 */
export abstract class CypherASTNode implements CypherCompilable {
    protected parent?: CypherASTNode;

    /**
     * @hidden
     */
    constructor(parent?: CypherASTNode) {
        this.parent = parent;
    }

    /**
     * @hidden
     */
    public getRoot(): CypherASTNode {
        if (this.parent) {
            return this.parent.getRoot();
        }
        return this;
    }

    /** Concrete tree traversal pattern to generate the Cypher on nested nodes */
    public abstract getCypher(env: CypherEnvironment): string;

    /** Sets the parent-child relationship for build traversal */
    protected addChildren(...nodes: CypherCompilable[]): void {
        for (const node of nodes) {
            if (node instanceof CypherASTNode) {
                node.setParent(this);
            }
        }
    }

    protected setParent(node: CypherASTNode): void {
        this.parent = node;
    }

    protected get isRoot(): boolean {
        return this.parent === undefined;
    }
}
