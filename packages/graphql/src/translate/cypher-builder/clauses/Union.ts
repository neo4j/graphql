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
import { Clause } from "./Clause";

export class Union extends Clause {
    private subqueries: CypherASTNode[] = [];
    private includeAll = false;

    constructor(...subqueries: Clause[]) {
        super();
        this.subqueries = subqueries.map((s) => s.getRoot());
        this.addChildren(...subqueries);
    }

    public all(): this {
        this.includeAll = true;
        return this;
    }

    public getCypher(env: CypherEnvironment): string {
        const subqueriesStr = this.subqueries.map((s) => s.getCypher(env));
        const unionStr = this.includeAll ? "UNION ALL" : "UNION";

        return subqueriesStr.join(`\n${unionStr}\n`);
    }
}
