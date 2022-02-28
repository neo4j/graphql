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

import { CypherParam, CypherReference } from "./references/Reference";

export interface CypherContextInterface {
    getReferenceId(reference: CypherReference): string;
    getParamId(reference: CypherParam): string;
}

export class CypherContext implements CypherContextInterface {
    private prefix: string;
    private params: Map<CypherParam, string> = new Map();
    private references: Map<CypherReference, string> = new Map();

    constructor(prefix?: string) {
        this.prefix = prefix || "";
    }

    public getParamId(reference: CypherParam): string {
        const id = this.params.get(reference);
        if (!id) {
            return this.addParamReference(reference);
        }
        return id;
    }

    public getReferenceId(reference: CypherReference): string {
        const id = this.references.get(reference);
        if (!id) {
            return this.addReference(reference);
        }
        return id;
    }

    public getParams(): Record<string, any> {
        const paramList = Array.from(this.params.keys());

        return paramList.reduce((acc, param: CypherParam) => {
            const key = this.getParamId(param);
            acc[key] = param.value;
            return acc;
        }, {} as Record<string, any>);
    }

    public addNamedParamReference(name: string, param: CypherParam): void {
        this.params.set(param, name);
    }

    private addReference(reference: CypherReference): string {
        const refIndex = this.references.size;
        const referenceId = `${this.prefix}${reference.prefix}${refIndex}`;
        this.references.set(reference, referenceId);
        return referenceId;
    }

    private addParamReference(param: CypherParam): string {
        const refIndex = this.params.size;
        const paramId = `${this.prefix}${param.prefix}${refIndex}`;
        this.params.set(param, paramId);
        return paramId;
    }
}
