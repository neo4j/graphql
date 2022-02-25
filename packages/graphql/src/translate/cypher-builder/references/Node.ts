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

import { stringifyObject } from "../../utils/stringify-object";
import { Param } from "../cypher-builder-references";
import { CypherReference } from "../cypher-builder-types";
import { CypherContext } from "../CypherContext";
import { escapeLabel, padLeft } from "../utils";

type NodeInput = {
    labels?: Array<string>;
    parameters?: Record<string, Param<any>>;
};

export class Node implements CypherReference {
    public readonly prefix = "this";
    private labels: Array<string>;
    private parameters: Record<string, Param<any>>;

    constructor(input: NodeInput) {
        this.labels = input.labels || [];
        this.parameters = input.parameters || {};
    }

    public getCypher(context: CypherContext) {
        const referenceId = this.getReference(context);
        let parametersStr = "";
        if (this.hasParameters()) {
            const parameters = serializeParameters(this.parameters, context);
            parametersStr = padLeft(parameters);
        }
        return `(${referenceId}${this.getLabelsString()}${parametersStr})`;
    }

    // TODO: should be private or protected
    public getReference(context: CypherContext): string {
        return context.getReferenceId(this);
    }

    private hasParameters(): boolean {
        return Object.keys(this.parameters).length > 0;
    }

    private getLabelsString(): string {
        const escapedLabels = this.labels.map(escapeLabel);
        if (escapedLabels.length === 0) return "";
        return `:${escapedLabels.join(":")}`;
    }
}

// TODO: move to common CypherBuilder utils
export function serializeParameters(parameters: Record<string, Param<any>>, context: CypherContext): string {
    const paramValues = Object.entries(parameters).reduce((acc, [key, param]) => {
        acc[key] = param.getCypher(context);
        return acc;
    }, {} as Record<string, string>);

    return stringifyObject(paramValues);
}
