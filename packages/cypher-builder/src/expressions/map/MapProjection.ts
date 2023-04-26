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
import type { Variable } from "../../references/Variable";
import { serializeMap } from "../../utils/serialize-map";
import { MapExpr } from "./MapExpr";
import { isString } from "../../utils/is-string";
import { escapeProperty } from "../../utils/escape";

/** Represents a Map projection
 * @see [Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/syntax/maps/#cypher-map-projection)
 * @group Expressions
 * @example
 * ```cypher
 * this { .title }
 * ```
 */

export class MapProjection implements CypherCompilable {
    private extraValues: Map<string, Expr> = new Map();
    private variable: Variable;
    private projection: string[];

    constructor(variable: Variable, projection: string[] = [], extraValues: Record<string, Expr> = {}) {
        this.variable = variable;
        this.projection = projection;
        this.setExtraValues(extraValues);
    }

    public set(values: Record<string, Expr> | string): void {
        if (isString(values)) {
            this.projection.push(values);
        } else {
            this.setExtraValues(values);
        }
    }

    private setExtraValues(values: Record<string, Expr>): void {
        Object.entries(values).forEach(([key, value]) => {
            if (!value) throw new Error(`Missing value on map key ${key}`);
            this.extraValues.set(key, value);
        });
    }

    /** Converts the Map projection expression into a normal Map expression
     * @example
     * Converts
     * ```cypher
     * this { .title }
     * ```
     * into:
     * ```cypher
     * { title: this.title }
     * ```
     */
    public toMap(): MapExpr {
        const projectionFields = this.projection.reduce((acc: Record<string, Expr>, field) => {
            acc[field] = this.variable.property(field);
            return acc;
        }, {});

        return new MapExpr({
            ...projectionFields,
            ...Object.fromEntries(this.extraValues),
        });
    }

    /** @internal */
    public getCypher(env: CypherEnvironment): string {
        const variableStr = this.variable.getCypher(env);
        const extraValuesStr = serializeMap(env, this.extraValues, true);

        const projectionStr = this.projection.map((p) => `.${escapeProperty(p)}`).join(", ");

        const commaStr = extraValuesStr && projectionStr ? ", " : "";

        return `${variableStr} { ${projectionStr}${commaStr}${extraValuesStr} }`;
    }
}
