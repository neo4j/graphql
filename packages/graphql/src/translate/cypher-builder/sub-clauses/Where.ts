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

import type { CypherASTNode } from "../CypherASTNode";
import type { CypherEnvironment } from "../Environment";
import type { ComparisonOp } from "../operations/comparison";
import { and, BooleanOp } from "../operations/boolean";
import { SubClause } from "./SubClause";
import type { RawCypher } from "../clauses/RawCypher";
import type { Exists } from "../Exists";

export type WhereParams = BooleanOp | ComparisonOp | RawCypher | Exists;

export class Where extends SubClause {
    private whereParams: WhereParams;
    protected whereClause = "WHERE";

    constructor(parent: CypherASTNode | undefined, whereInput: WhereParams) {
        super(parent);
        this.whereParams = whereInput;
        this.addChildren(this.whereParams);
    }

    public and(op: WhereParams): void {
        this.whereParams = and(this.whereParams, op);
        this.addChildren(this.whereParams);
    }

    public getCypher(env: CypherEnvironment): string {
        const opStr = this.whereParams.getCypher(env);
        if (!opStr) return "";
        return `WHERE ${opStr}`;
    }
}
