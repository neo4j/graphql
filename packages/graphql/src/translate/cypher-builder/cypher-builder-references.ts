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

import { stringifyObject } from "../utils/stringify-object";
import { escapeLabel, padLeft } from "./utils";
import { CypherContext } from "./CypherContext";

type NodeInput = {
    labels?: Array<string>;
    parameters?: Record<string, Param<any>>;
};

/** Represents a reference in AST */
export interface CypherReference {
    readonly prefix: string;
    getCypher(context: CypherContext): string;
}

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

// NOTE: this node is only for compatibility
export class NamedNode extends Node {
    private name: string;
    constructor(name: string, input?: NodeInput) {
        super(input || {});
        this.name = name;
    }

    public getReference(_context: CypherContext): string {
        return this.name;
    }
}

export type RelationshipInput = {
    source: Node;
    target: Node;
    type?: string;
    parameters?: Record<string, Param<any>>;
    directed?: boolean;
};

export class Relationship implements CypherReference {
    public readonly prefix: string = "this";
    public readonly source: Node;
    public readonly target: Node;

    private type?: string;
    private parameters: Record<string, Param<any>>;
    private directed: boolean;

    constructor(input: RelationshipInput) {
        this.type = input.type || undefined;
        this.parameters = input.parameters || {};
        this.source = input.source;
        this.target = input.target;
        this.directed = input.directed === undefined ? true : input.directed;
    }

    public getCypher(context: CypherContext) {
        const referenceId = context.getReferenceId(this);
        let parametersStr = "";
        if (this.hasParameters()) {
            const parameters = serializeParameters(this.parameters, context);
            parametersStr = padLeft(parameters);
        }

        // const sourceStr = this.source.getCypher(context);
        // const targetStr = this.target.getCypher(context);
        const sourceStr = `(${this.source.getReference(context)})`;
        const targetStr = `(${this.target.getReference(context)})`;
        const arrowStr = this.getRelationshipArrow();
        const relationshipStr = `${referenceId || ""}${this.getTypeString()}${parametersStr}`;

        return `${sourceStr}-[${relationshipStr}]${arrowStr}${targetStr}`;
    }

    private hasParameters(): boolean {
        return Object.keys(this.parameters).length > 0;
    }

    private getRelationshipArrow(): "-" | "->" {
        return this.directed ? "->" : "-";
    }

    private getTypeString(): string {
        return this.type ? `:${escapeLabel(this.type)}` : "";
    }
}

export class Param<T = any> {
    public readonly prefix: string = "param";
    public readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

    public getCypher(context: CypherContext): string {
        return `$${context.getParamId(this)}`;
    }
}

export class RawParam<T> extends Param<T> {
    public getCypher(_context: CypherContext): string {
        return `${this.value}`;
    }
}

function serializeParameters(parameters: Record<string, Param<any>>, context: CypherContext): string {
    const paramValues = Object.entries(parameters).reduce((acc, [key, param]) => {
        acc[key] = param.getCypher(context);
        return acc;
    }, {} as Record<string, string>);

    return stringifyObject(paramValues);
}
