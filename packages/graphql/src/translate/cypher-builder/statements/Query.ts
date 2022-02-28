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

import { CypherASTNode } from "../CypherASTNode";
import { CypherContextInterface } from "../CypherContext";
import { CypherResult } from "../types";

export class Query extends CypherASTNode {
    public cypher(_context: CypherContextInterface, childrenCypher: string): string {
        return childrenCypher;
    }

    public concat(query: CypherASTNode | undefined): this {
        if (query) {
            this.addStatement(query);
        }
        return this;
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
        const root = this.getRoot() as Query;
        return root.build(prefix);
    }
}
