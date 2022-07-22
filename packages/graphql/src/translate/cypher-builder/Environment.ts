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

import type { Variable } from "./variables/Variable";
import { Param } from "./variables/Param";

/** Hold the internal references of Cypher parameters and variables */
export class CypherEnvironment {
    private globalPrefix: string;

    private references: Map<Variable, string> = new Map();
    private params: Param[] = [];

    constructor(prefix?: string) {
        this.globalPrefix = prefix || "";
    }

    public getVariableId(variable: Variable): string {
        if (variable.id) return variable.id; // Overrides ids for compatibility reasons
        const id = this.references.get(variable);
        if (!id) {
            return this.addVariableReference(variable);
        }
        return id;
    }

    public getParams(): Record<string, any> {
        return this.params.reduce((acc, param: Param) => {
            const key = this.getVariableId(param).substring(1); // Removes leading $ in params
            acc[key] = param.value;
            return acc;
        }, {} as Record<string, any>);
    }

    public addNamedParamReference(name: string, param: Param): void {
        this.addParam(name, param);
    }

    public getParamsSize(): number {
        return this.params.length;
    }

    private addParam(id: string, param: Param): string {
        const paramId = `$${id}`;
        this.references.set(param, paramId);
        this.params.push(param);
        return paramId;
    }

    private addVariableReference(variable: Variable): string {
        const paramIndex = this.getParamsSize(); // Indexes are separate for readability reasons

        if (variable instanceof Param) {
            const varId = `${this.globalPrefix}${variable.prefix}${paramIndex}`;
            return this.addParam(varId, variable);
        }

        const varIndex = this.references.size - paramIndex;
        const varId = `${this.globalPrefix}${variable.prefix}${varIndex}`;
        this.references.set(variable, varId);
        return varId;
    }
}
