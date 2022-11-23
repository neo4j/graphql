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

import { Param } from "./references/Param";
import type { NamedReference, Reference } from "./references/Reference";

export type EnvPrefix = {
    params?: string;
    variables?: string;
};

/** Hold the internal references of Cypher parameters and variables */
export class CypherEnvironment {
    private readonly globalPrefix: EnvPrefix;

    private references: Map<Reference, string> = new Map();
    private params: Param[] = [];

    constructor(prefix?: string | EnvPrefix) {
        if (!prefix || typeof prefix === "string") {
            this.globalPrefix = {
                params: prefix || "",
                variables: prefix || "",
            };
        } else {
            this.globalPrefix = {
                params: prefix.params || "",
                variables: prefix.variables || "",
            };
        }
    }

    public getReferenceId(reference: Reference | NamedReference): string {
        if (this.isNamedReference(reference)) return reference.id; // Overrides ids for compatibility reasons
        const id = this.references.get(reference);
        if (!id) {
            return this.addVariableReference(reference);
        }
        return id;
    }

    public getParams(): Record<string, any> {
        return this.params.reduce((acc, param: Param) => {
            const key = this.getReferenceId(param);
            if (param.hasValue) {
                acc[key] = param.value;
            }
            return acc;
        }, {} as Record<string, any>);
    }

    public addNamedParamReference(name: string, param: Param): void {
        this.addParam(name, param);
    }

    public addExtraParams(params: Record<string, Param>): void {
        Object.entries(params).forEach(([key, param]) => {
            this.addNamedParamReference(key, param);
        });
    }

    public getParamsSize(): number {
        return this.params.length;
    }

    public getReferences(): Map<Reference, string> {
        return this.references;
    }

    private addParam(id: string, param: Param): string {
        const paramId = id;
        this.references.set(param, paramId);
        this.params.push(param);
        return paramId;
    }

    private addVariableReference(variable: Reference): string {
        const paramIndex = this.getParamsSize(); // Indexes are separate for readability reasons

        if (variable instanceof Param) {
            const varId = `${this.globalPrefix.params}${variable.prefix}${paramIndex}`;
            return this.addParam(varId, variable);
        }

        const varIndex = this.references.size - paramIndex;
        const varId = `${this.globalPrefix.variables}${variable.prefix}${varIndex}`;
        this.references.set(variable, varId);
        return varId;
    }

    private isNamedReference(ref: Reference | NamedReference): ref is NamedReference {
        return Boolean((ref as any).id);
    }
}
