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

import { WithOrder } from "./mixins/WithOrder";
import { applyMixins } from "./utils/apply-mixin";
import { Projection, ProjectionColumn } from "../sub-clauses/Projection";
import type { CypherEnvironment } from "../Environment";
import { Clause } from "./Clause";
import { compileCypherIfExists } from "../utils";

export class Return extends Clause {
    private projection: Projection;

    constructor(...columns: Array<"*" | ProjectionColumn>) {
        super();
        this.projection = new Projection(columns);
    }

    public addColumns(...columns: Array<"*" | ProjectionColumn>): void {
        this.projection.addColumns(columns);
    }

    public getCypher(env: CypherEnvironment): string {
        const projectionStr = this.projection.getCypher(env);
        const orderStr = compileCypherIfExists(this.orderByStatement, env, { prefix: "\n" });

        return `RETURN ${projectionStr}${orderStr}`;
    }
}

export interface Return extends WithOrder {}
applyMixins(Return, [WithOrder]);
