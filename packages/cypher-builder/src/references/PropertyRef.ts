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

import type { CypherEnvironment } from "../Environment";
import type { CypherCompilable, Expr } from "../types";
import { escapeLabel } from "../utils/escape-label";
import type { Reference } from "./Reference";
import type { Variable } from "./Variable";

/** Reference to a variable property
 * @group References
 * @example new Node({labels: ["Movie"]}).property("title")
 */
export class PropertyRef implements CypherCompilable {
    private _variable: Variable;
    private propertyPath: Array<string | Expr>;

    constructor(variable: Reference, ...properties: Array<string | Expr>) {
        this._variable = variable;
        this.propertyPath = properties;
    }

    public get variable(): Variable {
        return this._variable;
    }

    /** Access individual property via the PropertyRef class, using dot notation or square brackets notation if an expression is provided */
    public property(prop: string | Expr): PropertyRef {
        return new PropertyRef(this._variable, ...this.propertyPath, prop);
    }

    /**
     * @hidden
     */
    public getCypher(env: CypherEnvironment): string {
        const variableStr = this.variable.getCypher(env);

        const propStr = this.propertyPath.map((prop) => this.getPropertyCypher(prop, env)).join("");

        return `${variableStr}${propStr}`;
    }

    private getPropertyCypher(prop: string | Expr, env: CypherEnvironment): string {
        if (typeof prop === "string") {
            return `.${escapeLabel(prop)}`;
        } else {
            const exprStr = prop.getCypher(env);
            return `[${exprStr}]`;
        }
    }
}
