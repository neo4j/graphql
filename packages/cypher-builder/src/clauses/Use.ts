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

import type { CypherEnvironment } from "../Environment";
import { Clause } from "./Clause";
import type { CypherASTNode } from "../CypherASTNode";

/**
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/5/clauses/use/)
 * @group Clauses
 */
export class Use extends Clause {
    private graph: string;
    private subClause: CypherASTNode;

    constructor(graph: string, subClause: Clause) {
        super();
        this.subClause = subClause.getRoot();
        this.graph = graph;
        this.addChildren(this.subClause);
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const subClauseStr = this.subClause.getCypher(env);
        return `USE ${this.graph}\n${subClauseStr}`;
    }
}
