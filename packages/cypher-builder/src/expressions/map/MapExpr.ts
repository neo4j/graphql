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

/** Represents a Map
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/syntax/maps/)
 * @group Expressions
 */
export class MapExpr implements CypherCompilable {
    private map = new Map<string, Expr>();

    constructor(value: Record<string, Expr> = {}) {
        this.set(value);
    }

    public get size(): number {
        return this.map.size;
    }

    public set(key: string, value: Expr): void;
    public set(values: Record<string, Expr>): void;
    public set(keyOrValues: Record<string, Expr> | string, value?: Expr): void {
        if (typeof keyOrValues === "string") {
            this.setField(keyOrValues, value);
        } else {
            Object.entries(keyOrValues).forEach(([key, value]) => {
                this.setField(key, value);
            });
        }
    }

    private setField(key: string, value: Expr | undefined): void {
        if (!value) throw new Error(`Missing value on map key ${key}`);
        this.map.set(key, value);
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        return serializeMap(env, this.map);
    }
}
