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

import type { CypherCompilable } from "../types";

type LiteralValue = string | number | boolean | null | Array<LiteralValue>;

/** Represents a literal value
 * @group References
 */
export class Literal<T extends LiteralValue = any> implements CypherCompilable {
    public value: T;

    constructor(value: T) {
        this.value = value;
    }

    /** @internal */
    public getCypher(): string {
        return this.formatLiteralValue(this.value);
    }

    private formatLiteralValue(value: LiteralValue): string {
        if (typeof value === "string") {
            return `"${value}"`;
        }
        if (value === null) {
            return "NULL";
        }
        if (Array.isArray(value)) {
            const serializedValues = value.map((v) => this.formatLiteralValue(v));
            return `[${serializedValues.join(", ")}]`;
        }
        return `${value}`;
    }
}

/** Represents a `NULL` literal value
 * @group References
 */
export const CypherNull = new Literal(null);
