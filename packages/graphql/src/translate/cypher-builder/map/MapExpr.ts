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
import type { CypherEnvironment } from "../Environment";
import type { Expr } from "../types";

/** Represents a Map */
export class MapExpr extends CypherASTNode {
    private value: Record<string, Expr>;

    constructor(value: Record<string, Expr> = {}) {
        super();
        this.value = value;
    }

    public set(values: Record<string, Expr>): void {
        this.value = { ...this.value, ...values };
    }

    public getCypher(env: CypherEnvironment): string {
        return this.serializeObject(env);
    }

    private serializeObject(env: CypherEnvironment): string {
        const valuesList = Object.entries(this.value).map(([key, value]) => {
            return `${key}: ${value.getCypher(env)}`;
        });

        return `{ ${valuesList.join(", ")} }`;
    }
}
