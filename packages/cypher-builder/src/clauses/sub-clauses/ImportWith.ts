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

import type { Call } from "../Call";
import type { CypherEnvironment } from "../../Environment";
import type { PropertyRef } from "../../references/PropertyRef";
import type { Param } from "../../references/Param";
import type { Variable } from "../../references/Variable";
import { CypherASTNode } from "../../CypherASTNode";

export type SetParam = [PropertyRef, Param<any>];

/** Represents a WITH statement to import variables into a CALL subquery */
export class ImportWith extends CypherASTNode {
    private params: Variable[];

    constructor(parent: Call, params: Variable[] = []) {
        super(parent);
        this.params = params;
    }

    public getCypher(env: CypherEnvironment): string {
        const paramsStr = this.params.map((v) => v.getCypher(env));
        return `WITH ${paramsStr.join(", ")}`;
    }
}
