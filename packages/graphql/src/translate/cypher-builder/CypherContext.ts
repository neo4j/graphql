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

import { CypherParameter, CypherVariable } from "./references/References";



export interface CypherContextInterface {
    getVariableId(reference: CypherVariable): string;
    getParamId(reference: CypherParameter): string;
}

/** Hold the internal references of parameters and variables */
export class CypherContext implements CypherContextInterface {
    private prefix: string;
    private params: Map<CypherParameter, string> = new Map();
    private variables: Map<CypherVariable, string> = new Map();

    constructor(prefix?: string) {
        this.prefix = prefix || "";
    }

    public getParamId(param: CypherParameter): string {
        const id = this.params.get(param);
        if (!id) {
            return this.addParamReference(param);
        }
        return id;
    }

    public getVariableId(variable: CypherVariable): string {
        const id = this.variables.get(variable);
        if (!id) {
            return this.addReference(variable);
        }
        return id;
    }

    public getParams(): Record<string, any> {
        const paramList = Array.from(this.params.keys());

        return paramList.reduce((acc, param: CypherParameter) => {
            const key = this.getParamId(param);
            acc[key] = param.value;
            return acc;
        }, {} as Record<string, any>);
    }

    public addNamedParamReference(name: string, param: CypherParameter): void {
        this.params.set(param, name);
    }

    private addReference(reference: CypherVariable): string {
        const refIndex = this.variables.size;
        const referenceId = `${this.prefix}${reference.prefix}${refIndex}`;
        this.variables.set(reference, referenceId);
        return referenceId;
    }

    private addParamReference(param: CypherParameter): string {
        const refIndex = this.params.size;
        const paramId = `${this.prefix}${param.prefix}${refIndex}`;
        this.params.set(param, paramId);
        return paramId;
    }
}
