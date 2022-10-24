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

import type { CypherEnvironment } from "../../Environment";
import type { CypherCompilable, Expr } from "../../types";
import { serializeMap } from "../../utils/serialize-map";

/** Represents a Map */
export class MapExpr implements CypherCompilable {
    private value: Record<string, Expr | undefined>;

    constructor(value: Record<string, Expr | undefined> = {}) {
        this.value = value;
    }

    public set(key: string, value: Expr): void;
    public set(values: Record<string, Expr>): void;
    public set(keyOrValues: Record<string, Expr> | string, value?: Expr): void {
        if (typeof keyOrValues === "string") {
            this.value[keyOrValues] = value as Expr;
        } else {
            this.value = { ...this.value, ...keyOrValues };
        }
    }

    public getCypher(env: CypherEnvironment): string {
        return serializeMap(env, this.value);
    }
}
