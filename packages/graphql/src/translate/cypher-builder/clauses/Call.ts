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

import { Clause } from "./Clause";
import type { CypherEnvironment } from "../Environment";
import type { CypherASTNode } from "../CypherASTNode";
import { padBlock } from "../utils";
import { ImportWith } from "../sub-clauses/ImportWith";
import type { Variable } from "../variables/Variable";

export class Call extends Clause {
    private subQuery: CypherASTNode;
    private importWith: ImportWith | undefined;

    constructor(subQuery: Clause, parent?: Clause) {
        super(parent);
        const rootQuery = subQuery.getRoot();
        this.addChildren(rootQuery);
        this.subQuery = rootQuery;
    }

    public with(...params: Variable[]): this {
        if (this.importWith) throw new Error("Call import already set");
        this.importWith = new ImportWith(this, params);
        return this;
    }

    protected cypher(env: CypherEnvironment): string {
        let subQueryStr = this.subQuery.getCypher(env);
        if (this.importWith) {
            const withStr = this.importWith.getCypher(env);
            subQueryStr = `${withStr}\n${subQueryStr}`;
        }
        const paddedSubQuery = padBlock(subQueryStr);
        return `CALL {\n${paddedSubQuery}\n}`;
    }
}
