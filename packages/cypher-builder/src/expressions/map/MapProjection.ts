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
import type { Variable } from "../../variables/Variable";
import { serializeMap } from "../../utils/serialize-map";

/** Represents a Map projection https://neo4j.com/docs/cypher-manual/current/syntax/maps/#cypher-map-projection */
export class MapProjection implements CypherCompilable {
    private extraValues: Record<string, Expr>;
    private variable: Variable;
    private projection: string[];

    constructor(variable: Variable, projection: string[], extraValues: Record<string, Expr> = {}) {
        this.variable = variable;
        this.projection = projection;
        this.extraValues = extraValues;
    }

    public set(values: Record<string, Expr> | string): void {
        if (values instanceof String) {
            this.projection.push(values as string);
        } else {
            this.extraValues = { ...this.extraValues, ...(values as Record<string, Expr>) };
        }
    }

    public getCypher(env: CypherEnvironment): string {
        const variableStr = this.variable.getCypher(env);
        const extraValuesStr = serializeMap(env, this.extraValues, true);

        const projectionStr = this.projection.join(", ");

        const commaStr = extraValuesStr && projectionStr ? ", " : "";

        return `${variableStr} { ${projectionStr}${commaStr}${extraValuesStr} }`;
    }
}
